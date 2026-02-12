This project uses a single properties table with a parent–child relationship to support:

Standalone properties (normal listings)

Parent containers (Tower, Market, Sharak)

Child units inside a parent (Apartment, Shop, Office, House, Land)

The Add Property flow is strictly controlled to avoid data confusion and to match real-world real-estate workflows.

Core Concepts
1. Property Types

There are three logical property flows, all stored in the same table:

Type	Description
Standalone listing	Independent property listed for sale/rent
Parent container	A building/project that holds multiple units
Child unit	A property unit inside a parent container
2. Record Kind

Each row in properties has a record_kind:

container → Tower / Market / Sharak

listing → Standalone properties and child units

👉 Only listings appear in sale/rent feeds
👉 Containers never appear in property listings

Entry Points (How Properties Are Created)
A. Central “Add” Button (Standalone Only)

Purpose: Create standalone properties

Behavior:

Opens Standalone Add Property Wizard

property_category is automatically set to:

normal


parent_id = null

Property Category field is hidden

User cannot create child units here

Allowed standalone property types:

House

Apartment

Shop

Office

Land / Plot

B. Parent Container Creation

Containers are created via dedicated flows, not from the central Add button.

Supported containers:

Tower

Market

Sharak

Rules:

record_kind = container

parent_id = null

Sale/Rent options are disabled

Used only as containers for units

C. Child Unit Creation (From Parent Profile Only)

Child units can only be added from a parent profile page.

Example:

Open Khorsheed Tower

Click “Add Unit”

Behavior:

parent_id is set automatically

property_category is inherited from parent

Property Category field is hidden

Location, map location, and amenities are inherited

Property Category Handling (Automatic)
Entry Context	property_category
Central Add Button	normal
Add from Tower	tower
Add from Market	market
Add from Sharak	sharak

👉 Category is never selectable manually.

Property Type Rules (Conditional)
Tower → Allowed Unit Types

Apartment

Shop

Office

Market → Allowed Unit Types

Shop

Office

Sharak → Allowed Unit Types

Apartment

Shop

Office

House

Land / Plot

The Property Type dropdown is filtered automatically based on the parent.

Backend validates this strictly.

Form Behavior by Type
Parent Containers (Tower / Market / Sharak)

Fields shown:

Name / Title

Description

Media

Location

Map location (optional)

Amenities

Planned units (stored in details)

Hidden / Disabled:

Sale / Rent options

Price fields

Bedrooms / Bathrooms / Size

Child Units (Inside Parent)
Apartment Unit

Fields shown:

Title

Description

Floor

Apartment number

Size

Bedrooms

Bathrooms

Media

Shop Unit

Fields shown:

Title

Description

Floor

Size

Media

Office Unit

Fields shown:

Title

Description

Floor

Size

Media

House Unit

Fields shown:

Title

Description

Size

Bedrooms

Bathrooms

Media

Land / Plot Unit

Fields shown:

Title

Description

Size

Media

Hidden for all child units:

Location

Map location

Amenities

👉 These are inherited from the parent.

Standalone Listings

Fields shown:

Title

Description

Property-type specific fields

Location

Map location

Amenities

Media

Sale / Rent toggles

Prices

Sale & Rent Logic (No Purpose Field)

The system does not use a purpose field.

Instead:

is_available_for_sale

is_available_for_rent

Rules:

If Sale is checked → property is for sale

If Rent is checked → property is for rent

Both can be true

At least one must be true for listings

Containers always have both false

Backend Enforcement (Critical)

The backend always enforces:

Correct record_kind

Correct property_category

Correct parent_id

Allowed property_type

Inheritance of location & amenities

Ignoring forbidden fields from client payload

Frontend validation is not trusted alone.

Why This Design

Prevents wrong data entry

Matches real-world real estate workflow

Scales nationwide

Easy to extend with new property types

Keeps UI simple for agents

Uses one table, clean logic

Summary (Mental Model)

Central Add = Standalone
Parent Profile = Child Units
Containers hold units, not listings
Everything inherits from parent when inside a container