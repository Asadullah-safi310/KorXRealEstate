Add Property Flow (Short README)

This project uses one properties table with a parent → child relationship to manage standalone listings and container-based properties (Tower, Market, Sharak).

Property Types

There are 3 logical types of entries:

Standalone Listing

Parent Container (Tower / Market / Sharak)

Child Unit (inside a parent)

All are stored in the same table.

Record Kind
record_kind	Meaning
container	Parent property (not for sale/rent)
listing	Standalone or child unit

Only listing records appear in sale/rent listings.

Entry Points
1️⃣ Central “Add” Button

Creates standalone listings only

property_category = normal

parent_id = null

Property Category field is hidden

2️⃣ Parent Containers

Created via dedicated flows (not central Add)

Types: Tower, Market, Sharak

record_kind = container

Used only to group child units

3️⃣ Child Units

Created only from parent profile pages

parent_id set automatically

property_category inherited from parent

Location & amenities inherited

Allowed Unit Types
Parent	Allowed Units
Tower	apartment, shop, office
Market	shop, office
Sharak	apartment, shop, office, house, land

Property Type options are filtered automatically.

Form Behavior
Parent Containers

Show: title, description, media, location, amenities

Hide: price, sale/rent, bedrooms, bathrooms

Child Units

Show only unit-specific fields

Hide location, map, amenities (inherited)

Standalone Listings

Full form

Own location, amenities, sale/rent options

Sale & Rent Logic

No purpose field.

is_available_for_sale

is_available_for_rent

At least one must be true for listings.
Containers always have both false.

Backend Rules (Always Enforced)

Valid parent → child relationship

Correct category & record kind

Allowed property types

Inherited fields override client input

Invalid fields are ignored

Key Principle

Central Add = Standalone
Parent Profile = Child Units
Containers group units, never sell directly