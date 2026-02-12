import { 
  withSpring, 
  withTiming, 
  useAnimatedStyle, 
  useSharedValue, 
  interpolate,
  Extrapolate,
  Layout,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  FadeOutDown,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  SlideInUp,
  SlideOutUp,
  SlideInDown,
  SlideOutDown,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

// Spring Configurations
export const springConfig = {
  damping: 15,
  stiffness: 120,
  mass: 1,
};

export const gentleSpring = {
  damping: 20,
  stiffness: 90,
  mass: 0.8,
};

export const bouncySpring = {
  damping: 10,
  stiffness: 150,
  mass: 0.6,
};

// Timing Configurations
export const timingConfig = {
  duration: 300,
};

export const fastTiming = {
  duration: 200,
};

export const slowTiming = {
  duration: 500,
};

// Wizard Step Transitions
export const wizardNextIn = SlideInRight.duration(300).withInitialValues({ opacity: 0 }).withCallback((finished) => {
  'worklet';
  if (finished) {
    // Optional callback
  }
});

export const wizardNextOut = SlideOutLeft.duration(300).withInitialValues({ opacity: 1 });
export const wizardBackIn = SlideInLeft.duration(300).withInitialValues({ opacity: 0 });
export const wizardBackOut = SlideOutRight.duration(300).withInitialValues({ opacity: 1 });

// List Item Entrance Animations
export const listItemEntrance = (index: number) => {
  return FadeInDown.delay(Math.min(index * 50, 400)).duration(400).springify();
};

export const staggeredFadeIn = (index: number, maxDelay: number = 300) => {
  return FadeIn.delay(Math.min(index * 60, maxDelay)).duration(350);
};

// Card Animations
export const cardEntrance = FadeInUp.duration(400).springify();
export const cardExit = FadeOut.duration(200);

// Form Field Animations
export const fieldFocusIn = SlideInUp.duration(200).springify();
export const fieldFocusOut = SlideOutUp.duration(150);

export const errorMessageIn = FadeInDown.duration(250).springify();
export const errorMessageOut = FadeOutUp.duration(200);

// Modal/Overlay Animations
export const modalIn = FadeIn.duration(250);
export const modalOut = FadeOut.duration(200);
export const overlaySlideIn = SlideInDown.duration(300).springify();
export const overlaySlideOut = SlideOutDown.duration(250);

// Shared Layout Transitions
export const smoothLayout = Layout.springify().damping(15).stiffness(120);

// Press/Tap Feedback Scales
export const pressFeedbackScale = 0.97;
export const subtlePressFeedbackScale = 0.98;
export const strongPressFeedbackScale = 0.95;
export const heartBounceScale = 1.3;

// Interaction Helpers
export const usePressAnimation = (targetScale: number = pressFeedbackScale) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  const onPressIn = () => {
    scale.value = withSpring(targetScale, springConfig);
  };
  
  const onPressOut = () => {
    scale.value = withSpring(1, springConfig);
  };
  
  return { animatedStyle, onPressIn, onPressOut };
};

export const useFavoriteAnimation = () => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  const animate = () => {
    scale.value = withSequence(
      withSpring(heartBounceScale, bouncySpring),
      withSpring(1, springConfig)
    );
  };
  
  return { animatedStyle, animate };
};

export const useScaleAnimation = (initialValue: number = 1) => {
  const scale = useSharedValue(initialValue);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  
  const scaleTo = (value: number, config = springConfig) => {
    scale.value = withSpring(value, config);
  };
  
  return { scale, animatedStyle, scaleTo };
};

export const useFadeAnimation = (initialOpacity: number = 1) => {
  const opacity = useSharedValue(initialOpacity);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));
  
  const fadeTo = (value: number, config = timingConfig) => {
    opacity.value = withTiming(value, config);
  };
  
  const fadeIn = (config = timingConfig) => {
    opacity.value = withTiming(1, config);
  };
  
  const fadeOut = (config = timingConfig) => {
    opacity.value = withTiming(0, config);
  };
  
  return { opacity, animatedStyle, fadeTo, fadeIn, fadeOut };
};

export const useSlideAnimation = (initialY: number = 0) => {
  const translateY = useSharedValue(initialY);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));
  
  const slideTo = (value: number, config = springConfig) => {
    translateY.value = withSpring(value, config);
  };
  
  return { translateY, animatedStyle, slideTo };
};

// Utility Functions
export const createPressHandler = (
  scaleValue: any,
  targetScale: number = pressFeedbackScale,
  config = springConfig
) => {
  return {
    onPressIn: () => {
      scaleValue.value = withSpring(targetScale, config);
    },
    onPressOut: () => {
      scaleValue.value = withSpring(1, config);
    },
  };
};

export const animateSequence = (
  sharedValue: any,
  sequence: number[],
  config = springConfig
) => {
  const animations = sequence.map(value => withSpring(value, config));
  sharedValue.value = withSequence(...animations);
};
