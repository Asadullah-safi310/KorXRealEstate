✅ My key recommendations (small but important)

Add record_kind: container | listing (you already liked this).

Parents = container (never in sale/rent feeds)

Children + standalone = listing

Don’t store “No-of-homes/shops” as the real count
Store it as planned capacity (optional) like planned_units in details.
The real count should be derived by COUNT(children).

Use details JSON only for extra type fields
Keep common fields as normal columns (title, description, size, etc.), and store only:

apartment_no, shop_number, floor (if you prefer), etc.


✅  Prompt :

I want to implement a real-world scalable Parent → Child → Standalone property system using ONE MySQL table properties with a self relationship (parent_id), while keeping different UI fields and validations for:

Parent containers: Tower / Market / Sharak

Child units inside a parent: Apartment / Shop / Office / House / Land

Standalone listings (normal properties not attached to any parent) and include all: Apartment / Shop / Office / House / Land

My system is permission-based and will be used nationwide in Afghanistan.

1) Data Model (MySQL)
Table: properties (single table)

Ensure these columns exist (create migration safely if needed):

Core

id PK
title (required)
description (nullable)
record_kind ENUM('container','listing') NOT NULL DEFAULT 'listing'
property_category ENUM('tower','market','sharak','normal') NOT NULL
property_type ENUM('house','shop','office','plot','land','apartment') NOT NULL
parent_id NULL FK → properties.id
status ENUM('draft','active','inactive') DEFAULT 'draft'
created_by_agent_id (FK or int)
Listing / sale-rent fields (only for listings)
purpose ENUM('rent','sale') NULL
price NULL
other availability fields you already have
Location fields
province, city, district, address NULL
lat, lng NULL
map_lat, map_lng NULL (if separate) OR reuse lat/lng and allow null

Shared fields
amenities (if stored as JSON or via join table)
media (if separate table, keep relationship)
Type-specific
details JSON NULL
Indexes:
INDEX(parent_id)
INDEX(property_category, parent_id)
INDEX(record_kind)
INDEX(record_kind, status)
(Optional) INDEX(city, district)
Backfill / Rules in DB migration

If parent_id IS NULL AND property_category IN ('tower','market','sharak') → set record_kind='container'
Otherwise → record_kind='listing'

2) Business Rules (must be enforced in backend)
A) Parent Containers (record_kind='container')

parent_id = NULL
property_category IN ('tower','market','sharak')
Must NOT be listed for sale/rent:
force purpose = NULL, price = NULL, and hide availability fields in UI
Must NOT show unit-only fields in UI:
hide bedrooms/bathrooms/size for parent containers

Parent fields:
title/name, description
media
location (required)
map location (optional/skippable)
amenities
planned capacity:
Tower: No-of-homes planned
Market: No-of-shops planned
Sharak: optional later
Store this in details.planned_units (or separate key):

details = { "planned_units": number }

B) Child Units (record_kind='listing', parent_id NOT NULL)

parent_id = <parent.id>

Inherit from parent:
location,
map location (if available),
amenities

Child UI must NOT show:
location fields,
map location fields,
amenities,

Allowed child types by parent category:
Market → shop | office,
Sharak → house | plot | shop | office,
Tower → ap| shop | office

--Child forms--:

Apartment child: title, description, floor, apartment_no, size, media, bedrooms, bathrooms,
Shop child: title, description, floor, size, media, shop_number(optional),
Office child: title, description, floor, size, media,
House child: title, description, size, media, bedrooms, bathrooms,
Land child: title, description, size, media

Store unit-specific extras in details:

Apartment: details = { "floor": n, "apartment_no": "A-12" },
Shop: details = { "floor": n, "shop_number": "S-10" },
Office: details = { "floor": n }
Keep JSON keys consistent.

C) Standalone Listings (record_kind='listing', parent_id NULL, category='normal')

parent_id = NULL
property_category = 'normal'

Full location REQUIRED
amenities + media are its own (not inherited)

All the same listing forms exist for standalone:
house/apartment/shop/office/land/plot

Standalone UI shows location + amenities + map location.
artment 





3) Backend API Structure (Node/Express)

Implement clean endpoints (even if they write to same table):

Parents (containers)

POST /parents

create container

force record_kind='container'

force parent_id=NULL

force purpose=NULL and clear listing fields

validate required fields based on category (tower/market/sharak)

store planned counts in details (planned_units)

GET /agent/parents?category=tower|market|sharak

return container list for the logged-in agent

include derived counts:

total_children = COUNT(children)

available_children = COUNT(children WHERE status='active' ...)

GET /parents/:id

returns container profile details

GET /parents/:id/children

returns child listings under this container

Children creation (units)

POST /parents/:id/children

load parent

validate allowed child types based on parent category

force:

record_kind='listing'

parent_id = :id

ignore location, map location, amenities from request

keep child’s own title/description/details/media

response should include effective location/amenities resolved from parent

Standalone listings

POST /properties

force:

record_kind='listing'

property_category='normal'

parent_id=NULL

require full location + listing fields (purpose/price etc.)

Listing queries (IMPORTANT)

Every “Properties feed/list/search” endpoint must exclude containers:

always filter: record_kind = 'listing'

Containers should only appear in:

My Towers / My Markets / My Sharaks lists

Container sections in Home tab (reels cards)

Parent profile pages

4) Permissions (backend + UI)

Enforce permission checks on backend (not only UI).
Example:

tower.container.create / readMine

market.container.create / readMine

sharak.container.create / readMine

tower.child.create

market.child.create

sharak.child.create

listing.normal.create

Hide buttons on UI if not permitted, but backend must block too.

5) Mobile UI (Expo RN)
A) Central “Add” button = Standalone ONLY

When agent clicks central Add button, open standalone wizard only.

Hide Property Category  (category fixed to normal).

This flow cannot create child units.

B) Container creation screens

Provide three container creation flows:

Add Tower container

Add Market container

Add Sharak container
Each shows only container fields (no listing fields).

C) Child creation entry only from Parent Profile

On parent profile screens (tower/market/sharak):

show “Add unit” button

opens the child wizard with parent context

hide inherited fields (location/amenities/map)

restrict unit type options based on parent category

D) Details display

When showing a child listing, UI should show:

unit fields (beds/baths/size)

plus details fields (floor/apartment_no/shop_number)
Location/amenities should display as resolved values from parent.

6) Deliverables

MySQL migration SQL for record_kind + indexes + safe backfill

Backend: controllers/services updated with:

validation rules

inheritance logic

listing queries filter out containers

Mobile: 3 forms and navigation flow implemented exactly

Confirm:

creating container does NOT show in listing feed

children show in listing feed + under parent profile

standalone works normally

inherited fields are not shown in child form but display on details screens

7) Constraints

Keep changes minimal and consistent with existing code style.

Do not break existing “My Apartments” pattern; refactor to reuse where possible.

Do not change my backend folder/services/api logic except required to support this system.

Maintain data safety during migration.

If you need clarifications, follow these decisions by default:

Containers are never sell/rent.

Planned “No-of-homes/shops” is stored in details.planned_units.

Actual count is derived from children count in queries.