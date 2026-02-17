import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, PanResponder, TextInput } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../../hooks/useThemeColor';
import ScreenLayout from '../../../components/ScreenLayout';
import { AppText } from '../../../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { personService } from '../../../services/person.service';
import { userService } from '../../../services/user.service';
import { locationService } from '../../../services/location.service';
import propertyStore from '../../../stores/PropertyStore';
import filterStore from '../../../stores/FilterStore';
import authStore from '../../../stores/AuthStore';
import { useLanguage } from '../../../contexts/LanguageContext';

const PriceRangeSlider = ({ min, max, currency, onValueChange, onCurrencyChange, themeColors }: any) => {
  const { t } = useLanguage();
  const [width, setWidth] = useState(0);
  const [pageX, setPageX] = useState(0);
  const viewRef = useRef<View>(null);
  const [minInput, setMinInput] = useState(String(min ?? '0'));
  const [maxInput, setMaxInput] = useState(String(max ?? '0'));
  
  const RANGE_MIN = 0;
  const baseMax = currency === 'USD' ? 500000 : 15000000;
  const parsedMin = parseFloat(min);
  const parsedMax = parseFloat(max);
  const minVal = Number.isFinite(parsedMin) ? parsedMin : RANGE_MIN;
  const maxValRaw = Number.isFinite(parsedMax) ? parsedMax : baseMax;
  const RANGE_MAX = Math.max(baseMax, maxValRaw, Number(maxInput) || 0);
  const maxVal = maxValRaw;
  
  const histogramData = [5, 8, 12, 18, 25, 40, 35, 45, 60, 55, 40, 30, 25, 18, 12, 8, 5, 3, 2, 1];

  useEffect(() => {
    setMinInput(String(minVal));
    setMaxInput(String(maxVal));
  }, [minVal, maxVal]);

  const getPosFromValue = (value: number) => {
    if (width === 0) return 0;
    return ((value - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * width;
  };

  const getValueFromPos = useCallback((pos: number) => {
    return Math.round(RANGE_MIN + (pos / width) * (RANGE_MAX - RANGE_MIN));
  }, [width, RANGE_MAX, RANGE_MIN]);

  const leftPos = getPosFromValue(minVal);
  const rightPos = getPosFromValue(maxVal);

  const panResponderLeft = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const newPos = Math.max(0, Math.min(gestureState.moveX - pageX, rightPos - 20));
      const newValue = Math.max(RANGE_MIN, getValueFromPos(newPos));
      onValueChange(newValue, maxVal);
    },
  }), [pageX, rightPos, maxVal, onValueChange, getValueFromPos, RANGE_MIN]);

  const panResponderRight = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const newPos = Math.min(width, Math.max(leftPos + 20, gestureState.moveX - pageX));
      const newValue = Math.min(RANGE_MAX, getValueFromPos(newPos));
      onValueChange(minVal, newValue);
    },
  }), [width, pageX, leftPos, minVal, onValueChange, getValueFromPos, RANGE_MAX]);

  const onLayout = () => {
    viewRef.current?.measure((x, y, w, h, px, py) => {
      setWidth(w);
      setPageX(px);
    });
  };

  const formatCurrency = (val: number) => {
    if (currency === 'USD') {
      return '$' + val.toLocaleString();
    } else {
      if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr AF`;
      if (val >= 100000) return `${(val / 100000).toFixed(1)} Lac AF`;
      return val.toLocaleString() + ' AF';
    }
  };

  return (
    <View>
      <View style={styles.priceInputRow}>
        <View style={[styles.priceInputWrap, { borderColor: themeColors.border, backgroundColor: themeColors.background }]}>
          <AppText variant="tiny" weight="bold" style={[styles.priceInputLabel, { color: themeColors.subtext }]}>{t('filters.min')}</AppText>
          <TextInput
            value={minInput}
            onChangeText={setMinInput}
            onEndEditing={() => {
              const nextMin = Math.max(RANGE_MIN, Number(minInput) || 0);
              const nextMax = Math.max(nextMin, maxVal);
              onValueChange(nextMin, nextMax);
            }}
            keyboardType="numeric"
            style={[styles.priceInputField, { color: themeColors.text }]}
            placeholder="0"
            placeholderTextColor={themeColors.subtext}
          />
        </View>
        <View style={[styles.priceInputWrap, { borderColor: themeColors.border, backgroundColor: themeColors.background }]}>
          <AppText variant="tiny" weight="bold" style={[styles.priceInputLabel, { color: themeColors.subtext }]}>{t('filters.max')}</AppText>
          <TextInput
            value={maxInput}
            onChangeText={setMaxInput}
            onEndEditing={() => {
              const nextMax = Math.max(Number(maxInput) || 0, RANGE_MIN);
              const nextMin = Math.min(minVal, nextMax);
              onValueChange(nextMin, nextMax);
            }}
            keyboardType="numeric"
            style={[styles.priceInputField, { color: themeColors.text }]}
            placeholder={String(baseMax)}
            placeholderTextColor={themeColors.subtext}
          />
        </View>
      </View>

      <View style={styles.currencyToggle}>
        <TouchableOpacity
          style={[
            styles.currencyButton,
            { borderColor: themeColors.border },
            currency === 'AF' && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
          ]}
          onPress={() => onCurrencyChange('AF')}
        >
          <AppText style={[styles.currencyText, { color: currency === 'AF' ? '#fff' : themeColors.text }]}>AF</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.currencyButton,
            { borderColor: themeColors.border },
            currency === 'USD' && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
          ]}
          onPress={() => onCurrencyChange('USD')}
        >
          <AppText style={[styles.currencyText, { color: currency === 'USD' ? '#fff' : themeColors.text }]}>$</AppText>
        </TouchableOpacity>
      </View>
      
      <View 
        ref={viewRef}
        style={styles.sliderWrapper} 
        onLayout={onLayout}
      >
        <View style={styles.histogramContainer}>
          {histogramData.map((h, i) => {
            const barPos = (i / histogramData.length) * width;
            const isActive = barPos >= leftPos && barPos <= rightPos;
            return (
              <View 
                key={i} 
                style={[
                  styles.histogramBar, 
                  { height: h, backgroundColor: isActive ? themeColors.primary + '30' : themeColors.border }
                ]} 
              />
            );
          })}
        </View>

        <View style={[styles.sliderTrackBase, { backgroundColor: themeColors.border }]}>
          <View 
            style={[
              styles.sliderTrackHighlight, 
              { 
                left: leftPos, 
                width: rightPos - leftPos, 
                backgroundColor: themeColors.primary 
              }
            ]} 
          />
        </View>

        <View 
          style={[styles.sliderThumbHitArea, { left: leftPos - 20 }]} 
          {...panResponderLeft.panHandlers}
        >
          <View style={[
            styles.sliderThumb, 
            { 
              borderColor: themeColors.primary, 
              backgroundColor: '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 4,
              elevation: 3
            }
          ]} />
        </View>
        <View 
          style={[styles.sliderThumbHitArea, { left: rightPos - 20 }]} 
          {...panResponderRight.panHandlers}
        >
          <View style={[
            styles.sliderThumb, 
            { 
              borderColor: themeColors.primary, 
              backgroundColor: '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 4,
              elevation: 3
            }
          ]} />
        </View>

        <View style={styles.sliderLabels}>
          <AppText style={[styles.priceLabelValue, { color: themeColors.text }]}>{formatCurrency(minVal)}</AppText>
          <AppText style={[styles.priceLabelValue, { color: themeColors.text }]}>{formatCurrency(maxVal)}</AppText>
        </View>
      </View>
    </View>
  );
};

const FiltersScreen = observer(() => {
  const router = useRouter();
  const themeColors = useThemeColor();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [agents, setAgents] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const filters = filterStore.filters;

  const fetchAgents = useCallback(async () => {
    try {
      const response = authStore.isAuthenticated
        ? await personService.getAgents()
        : await userService.getPublicAgents();
      setAgents(response.data?.users || response.data || []);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        try {
          const response = await userService.getPublicAgents();
          setAgents(response.data?.users || response.data || []);
          return;
        } catch (fallbackError) {
          console.error('Failed to fetch public agents after 401', fallbackError);
        }
      }
      console.error('Failed to fetch agents', error);
    }
  }, [authStore.isAuthenticated]);

  const fetchProvinces = useCallback(async () => {
    try {
      const response = await locationService.getProvinces();
      setProvinces(response.data || []);
    } catch (error) {
      console.error('Failed to fetch provinces', error);
    }
  }, []);

  const fetchDistricts = useCallback(async (provinceId: string) => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }
    try {
      setLoading(true);
      const response = await locationService.getDistricts(provinceId);
      setDistricts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch districts', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAreas = useCallback(async (districtId: string) => {
    if (!districtId) {
      setAreas([]);
      return;
    }
    try {
      setLoading(true);
      const response = await locationService.getAreas(districtId);
      setAreas(response.data || []);
    } catch (error) {
      console.error('Failed to fetch areas', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchProvinces();
  }, [fetchAgents, fetchProvinces]);

  useEffect(() => {
    if (filters.province_id) {
      fetchDistricts(filters.province_id);
    } else {
      setDistricts([]);
      filterStore.updateFilters({ district_id: '', area_id: '' });
    }
  }, [filters.province_id, fetchDistricts]);

  useEffect(() => {
    if (filters.district_id) {
      fetchAreas(filters.district_id);
    } else {
      setAreas([]);
      filterStore.updateFilter('area_id', '');
    }
  }, [filters.district_id, fetchAreas]);

  const updateFilter = (name: string, value: string) => {
    filterStore.updateFilter(name as any, value);
  };

  const clearFilters = () => {
    filterStore.clearFilters();
  };

  const applyFilters = async () => {
    setSearching(true);
    try {
      const queryParams: any = {};
      
      if (filters.search) queryParams.search = filters.search;
      if (filters.province_id) queryParams.province_id = filters.province_id;
      if (filters.district_id) queryParams.district_id = filters.district_id;
      if (filters.area_id) queryParams.area_id = filters.area_id;
      if (filters.property_type) queryParams.property_type = filters.property_type;
      if (filters.bedrooms) queryParams.bedrooms = filters.bedrooms;
      if (filters.bathrooms) queryParams.bathrooms = filters.bathrooms;
      if (filters.agent_id) queryParams.agent_id = filters.agent_id;
      if (filters.amenities && filters.amenities.length > 0) {
        queryParams.amenities = filters.amenities.join(',');
      }
      
      if (filters.property_category) {
        queryParams.property_category = filters.property_category;
        queryParams.record_kind = 'container';
      } else if (filters.record_kind) {
        queryParams.record_kind = filters.record_kind;
      } else {
        queryParams.record_kind = 'listing';
      }
      
      if (filters.purpose === 'sale') {
        queryParams.is_available_for_sale = true;
      } else if (filters.purpose === 'rent') {
        queryParams.is_available_for_rent = true;
      }
      
      if (filters.min_price) {
        if (filters.purpose === 'rent') {
          queryParams.min_rent_price = filters.min_price;
        } else {
          queryParams.min_sale_price = filters.min_price;
        }
      }
      const maxPriceThreshold = filters.currency === 'USD' ? 500000 : 50000000;
      if (filters.max_price && filters.max_price !== String(maxPriceThreshold)) {
        if (filters.purpose === 'rent') {
          queryParams.max_rent_price = filters.max_price;
        } else {
          queryParams.max_sale_price = filters.max_price;
        }
      }
      
      if (filters.currency) {
        queryParams.currency = filters.currency;
      }

      queryParams.status = 'active';

      await propertyStore.searchProperties(queryParams, false);
      
      router.push('/(tabs)/properties');
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setSearching(false);
    }
  };

  const hasActiveFilters = () => {
    return filterStore.hasActiveFilters;
  };

  const getProvinceName = (id: string) => {
    const province = provinces.find((p: any) => String(p.id || p._id) === String(id));
    return province?.name || '';
  };

  const getDistrictName = (id: string) => {
    const district = districts.find((d: any) => String(d.id || d._id) === String(id));
    return district?.name || '';
  };

  return (
    <ScreenLayout backgroundColor={themeColors.background} bottomSpacing={0} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { 
          backgroundColor: themeColors.background,
          borderBottomColor: themeColors.border + '20'
        }]}>
          <View style={styles.headerContent}>
            <AppText variant="h2" weight="bold" style={[styles.headerTitle, { color: themeColors.text }]}>{t('filters.filters')}</AppText>
            <TouchableOpacity 
              onPress={clearFilters}
              style={[styles.resetButton, { 
                backgroundColor: hasActiveFilters() ? themeColors.primary : themeColors.border + '40'
              }]}
              disabled={!hasActiveFilters()}
            >
              <Ionicons name="refresh" size={16} color={hasActiveFilters() ? '#fff' : themeColors.subtext} />
              <AppText style={[styles.resetButtonText, { 
                color: hasActiveFilters() ? '#fff' : themeColors.subtext 
              }]}>{t('common.reset')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 2, paddingBottom: 180 }}
      >
        <View style={[styles.filterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>{t('filters.location')}</AppText>
          
          <AppText variant="tiny" weight="bold" style={[styles.filterLabel, { color: themeColors.subtext }]}>{t('filters.province').toUpperCase()}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.chipGrid}>
              {provinces.map((province: any) => {
                const provinceId = String(province.id || province._id);
                const isActive = filters.province_id === provinceId;
                return (
                  <TouchableOpacity
                    key={provinceId}
                    style={[
                      styles.filterChip,
                      { 
                        backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                        borderColor: isActive ? themeColors.primary : themeColors.border
                      }
                    ]}
                    onPress={() => updateFilter('province_id', isActive ? '' : provinceId)}
                    activeOpacity={0.7}
                  >
                    <AppText variant="tiny" weight="bold" style={[
                      styles.filterChipText,
                      { color: isActive ? themeColors.primary : themeColors.subtext }
                    ]}>{province.name}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {filters.province_id && districts.length > 0 && (
            <>
              <AppText variant="tiny" weight="bold" style={[styles.filterLabel, { color: themeColors.subtext, marginTop: 12 }]}>
                {t('filters.districtIn').toUpperCase()} {getProvinceName(filters.province_id).toUpperCase()}
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                <View style={styles.chipGrid}>
                  {districts.map((district: any) => {
                    const districtId = String(district.id || district._id);
                    const isActive = filters.district_id === districtId;
                    return (
                      <TouchableOpacity
                        key={districtId}
                        style={[
                          styles.filterChip,
                          { 
                            backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                            borderColor: isActive ? themeColors.primary : themeColors.border
                          }
                        ]}
                        onPress={() => updateFilter('district_id', isActive ? '' : districtId)}
                        activeOpacity={0.7}
                      >
                        <AppText variant="tiny" weight="bold" style={[
                          styles.filterChipText,
                          { color: isActive ? themeColors.primary : themeColors.subtext }
                        ]}>{district.name}</AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          {filters.district_id && areas.length > 0 && (
            <>
              <AppText variant="tiny" weight="bold" style={[styles.filterLabel, { color: themeColors.subtext, marginTop: 12 }]}>
                {t('filters.areaIn').toUpperCase()} {getDistrictName(filters.district_id).toUpperCase()}
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                <View style={styles.chipGrid}>
                  {areas.map((area: any) => {
                    const areaId = String(area.id || area._id);
                    const isActive = filters.area_id === areaId;
                    return (
                      <TouchableOpacity
                        key={areaId}
                        style={[
                          styles.filterChip,
                          { 
                            backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                            borderColor: isActive ? themeColors.primary : themeColors.border
                          }
                        ]}
                        onPress={() => updateFilter('area_id', isActive ? '' : areaId)}
                        activeOpacity={0.7}
                      >
                        <AppText variant="tiny" weight="bold" style={[
                          styles.filterChipText,
                          { color: isActive ? themeColors.primary : themeColors.subtext }
                        ]}>{area.name}</AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}
        </View>

        <View style={[styles.filterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>{t('filters.propertyType')}</AppText>
          <View style={styles.chipGrid}>
            {[
              { label: t('property.house'), value: 'house' },
              { label: t('property.apartment'), value: 'apartment' },
              { label: t('property.land'), value: 'land' },
              { label: t('property.shop'), value: 'shop' },
            ].map((item) => {
              const isActive = filters.property_type === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.filterChip, 
                    { 
                      backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                      borderColor: isActive ? themeColors.primary : themeColors.border
                    }
                  ]}
                  onPress={() => updateFilter('property_type', isActive ? '' : item.value)}
                  activeOpacity={0.7}
                >
                  <AppText variant="tiny" weight="bold" style={[
                    styles.filterChipText, 
                    { color: isActive ? themeColors.primary : themeColors.subtext }
                  ]}>{item.label}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.filterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>{t('filters.category')}</AppText>
          <View style={styles.chipGrid}>
            {[
              { label: t('property.tower'), value: 'tower' },
              { label: t('property.market'), value: 'market' },
              { label: t('property.sharak'), value: 'sharak' },
            ].map((item) => {
              const isActive = filters.property_category === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.filterChip, 
                    { 
                      backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                      borderColor: isActive ? themeColors.primary : themeColors.border
                    }
                  ]}
                  onPress={() => updateFilter('property_category', isActive ? '' : item.value)}
                  activeOpacity={0.7}
                >
                  <AppText variant="tiny" weight="bold" style={[
                    styles.filterChipText, 
                    { color: isActive ? themeColors.primary : themeColors.subtext }
                  ]}>{item.label}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.filterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>{t('filters.purpose')}</AppText>
          <View style={styles.chipGrid}>
            {[
              { label: t('property.forSale'), value: 'sale' },
              { label: t('property.forRent'), value: 'rent' },
            ].map((item) => {
              const isActive = filters.purpose === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.filterChip, 
                    { 
                      backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                      borderColor: isActive ? themeColors.primary : themeColors.border
                    }
                  ]}
                  onPress={() => updateFilter('purpose', isActive ? '' : item.value)}
                  activeOpacity={0.7}
                >
                  <AppText variant="tiny" weight="bold" style={[
                    styles.filterChipText, 
                    { color: isActive ? themeColors.primary : themeColors.subtext }
                  ]}>{item.label}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.filterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>
            {filters.purpose === 'rent' ? t('filters.priceRangeRent') : filters.purpose === 'sale' ? t('filters.priceRangeSale') : t('filters.priceRange')}
          </AppText>
          <PriceRangeSlider 
            min={filters.min_price || '0'} 
            max={filters.max_price || (filters.currency === 'USD' ? '500000' : '15000000')} 
            currency={filters.currency}
            themeColors={themeColors}
            onValueChange={(minVal: number, maxVal: number) => {
              filterStore.updateFilters({ min_price: String(minVal), max_price: String(maxVal) });
            }}
            onCurrencyChange={(currency: string) => {
              const newMin = 0;
              const newMax = currency === 'USD' ? 500000 : 15000000;
              filterStore.updateFilter('currency', currency);
              filterStore.updateFilters({ 
                min_price: String(newMin),
                max_price: String(newMax)
              });
            }}
          />
        </View>

        <View style={[styles.filterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>{t('filters.bedrooms')}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRowScroll}>
              {['ALL', ...Array.from({ length: 20 }, (_, i) => String(i + 1))].map((num) => {
                const isActive = filters.bedrooms === (num === 'ALL' ? '' : num);
                return (
                  <TouchableOpacity
                    key={`beds-${num}`}
                    style={[
                      styles.filterChipRound,
                      { 
                        backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                        borderColor: isActive ? themeColors.primary : themeColors.border
                      }
                    ]}
                    onPress={() => updateFilter('bedrooms', isActive ? '' : (num === 'ALL' ? '' : num))}
                    activeOpacity={0.7}
                  >
                    <AppText variant="tiny" weight="bold" style={[
                      styles.filterChipText, 
                      { color: isActive ? themeColors.primary : themeColors.subtext }
                    ]}>{num === 'ALL' ? t('common.all') : num}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={[styles.filterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>{t('filters.bathrooms')}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRowScroll}>
              {['ALL', ...Array.from({ length: 20 }, (_, i) => String(i + 1))].map((num) => {
                const isActive = filters.bathrooms === (num === 'ALL' ? '' : num);
                return (
                  <TouchableOpacity
                    key={`baths-${num}`}
                    style={[
                      styles.filterChipRound,
                      { 
                        backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                        borderColor: isActive ? themeColors.primary : themeColors.border
                      }
                    ]}
                    onPress={() => updateFilter('bathrooms', isActive ? '' : (num === 'ALL' ? '' : num))}
                    activeOpacity={0.7}
                  >
                    <AppText variant="tiny" weight="bold" style={[
                      styles.filterChipText, 
                      { color: isActive ? themeColors.primary : themeColors.subtext }
                    ]}>{num === 'ALL' ? t('common.all') : num}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {agents.filter((agent: any) => agent.role !== 'admin').length > 0 && (
          <View style={[styles.filterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <AppText variant="title" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>{t('filters.agent')}</AppText>
            <View style={styles.chipGrid}>
              {agents.filter((agent: any) => agent.role !== 'admin').map((agent: any) => {
                const isActive = filters.agent_id === String(agent.user_id);
                return (
                  <TouchableOpacity
                    key={agent.user_id}
                    style={[
                      styles.filterChip, 
                      { 
                        backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                        borderColor: isActive ? themeColors.primary : themeColors.border
                      }
                    ]}
                    onPress={() => updateFilter('agent_id', isActive ? '' : String(agent.user_id))}
                    activeOpacity={0.7}
                  >
                    <AppText variant="tiny" weight="bold" style={[
                      styles.filterChipText, 
                      { color: isActive ? themeColors.primary : themeColors.subtext }
                    ]}>{agent.full_name}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={[styles.filterCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <AppText variant="title" weight="bold" style={[styles.sectionTitle, { color: themeColors.text }]}>{t('property.amenities')}</AppText>
          <View style={styles.chipGrid}>
            {[
              { key: 'Parking', label: t('property.parking') },
              { key: 'Security Guard', label: t('property.securityGuard') },
              { key: 'Central Heating System', label: t('property.centralHeatingSystem') },
              { key: 'Cupboards', label: t('property.cupboards') },
              { key: 'Sunny', label: t('property.sunny') },
              { key: 'Basement', label: t('property.basement') },
              { key: 'AC', label: t('property.ac') },
              { key: 'Lift', label: t('property.lift') },
              { key: 'Furnished', label: t('property.furnished') },
              { key: 'Semi-Furnished', label: t('property.semiFurnished') },
              { key: 'Solar Facility', label: t('property.solarFacility') },
              { key: 'Generator Facility', label: t('property.generatorFacility') }
            ].map((amenity) => {
              const isActive = filters.amenities.includes(amenity.key);
              return (
                <TouchableOpacity
                  key={amenity.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? themeColors.primary + '15' : themeColors.background,
                      borderColor: isActive ? themeColors.primary : themeColors.border
                    }
                  ]}
                  onPress={() => {
                    const currentAmenities = filters.amenities || [];
                    if (isActive) {
                      filterStore.updateFilter('amenities', currentAmenities.filter((a: string) => a !== amenity.key));
                    } else {
                      filterStore.updateFilter('amenities', [...currentAmenities, amenity.key]);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <AppText variant="tiny" weight="bold" style={[
                    styles.filterChipText,
                    { color: isActive ? themeColors.primary : themeColors.subtext }
                  ]}>{amenity.label}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>

      <View style={[styles.footer, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[styles.applyBtn, { 
            backgroundColor: themeColors.primary, 
            opacity: searching ? 0.7 : 1 
          }]} 
          onPress={applyFilters}
          disabled={searching}
          activeOpacity={0.85}
        >
          {searching ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <AppText style={styles.applyBtnText}>{t('filters.searching')}</AppText>
            </>
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <AppText style={styles.applyBtnText}>
                {t('filters.searchProperties')}
                {hasActiveFilters() && ` (${Object.entries(filters).filter(([key, value]) => {
                  if (key === 'amenities') return Array.isArray(value) && value.length > 0;
                  return value !== '' && value !== 'USD';
                }).length})`}
              </AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 20,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  filterCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  filterLabel: {
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '300',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horizontalScroll: {
    marginHorizontal: -14,
    paddingHorizontal: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterRowScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  filterChipRound: {
    borderWidth: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sliderWrapper: {
    height: 88,
    justifyContent: 'center',
  },
  histogramContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 50,
    marginBottom: 8,
  },
  histogramBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  sliderTrackBase: {
    height: 6,
    borderRadius: 999,
    position: 'relative',
  },
  sliderTrackHighlight: {
    height: '100%',
    borderRadius: 999,
    position: 'absolute',
  },
  sliderThumbHitArea: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    top: 30,
    zIndex: 10,
  },
  sliderThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  priceLabelValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  priceInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  priceInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  priceInputLabel: {
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  priceInputField: {
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
  },
  centered: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  applyBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default FiltersScreen;
