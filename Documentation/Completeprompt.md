You are working on my Real Estate system (Expo React Native mobile app + Web + Node/Express backend + Oracle/MySQL DB).

⚠️ Important Rules

Do NOT use mock/static data.

Do NOT break existing property listing logic.

Follow my parent–child container concept exactly.

Keep database consistency.

Only adjust category, record_kind, and parent/child logic.

🎯 Goal

Implement correct logic for Property Category, record_kind, and is_parent depending on whether the property is:

1️⃣ A parent container (Tower / Sharak / Market)
2️⃣ A child unit inside a container
3️⃣ A standalone normal property

✅ Parent Containers (Already Existing Concept)

Parent containers include:

Tower

Sharak

Market

For parent containers:
record_kind = "container"
is_parent = 1
property_category = tower | sharak | market
parent_property_id = NULL
These represent buildings/projects that hold multiple units.

✅ Child Units Inside Containers

When an agent adds a unit inside an existing parent container:

General Rules

This is a listing, NOT a container.

Must always reference parent container.

record_kind = "listing"
is_parent = 0
parent_property_id = parent.id

Category Mapping Based on Parent
If parent = Tower :
property_category = "tower" , this should be by default, the does not select this
record_kind = "listing"
is_parent = 0

If parent = Sharak:
property_category = "sharak", this should be by default, the does not select this
record_kind = "listing"
is_parent = 0

If parent = Market:
property_category = "market"
record_kind = "listing"
is_parent = 0

Important:

Unit properties inherit category from parent.

User must NOT manually change category in this flow.

Location and amenities should also inherit from parent (as previously designed).

✅ Standalone Properties (Central + Button Flow)

When agent uses the central + button to add a normal property:

This means:

Not inside any container.

Independent listing.

So:

property_category = "normal"
record_kind = "listing"
is_parent = 0
parent_property_id = NULL


Examples:

standalone house

standalone shop

standalone office

land/plot

✅ Add Property Wizard Behavior
When opened from:
(MY Towers, My Markets, My Sharaks) buttons in the Profile tab
Hide Property Category selection.

Automatically assign category based on parent.

Lock parent relationship.

Central + Button:
Default category = "normal"

Show full wizard normally.

✅ Database Consistency Rules

Ensure:

No unit entry has record_kind="container"

No parent entry has is_parent=0
Standalone properties always have parent_property_id=NULL
Child units must always have valid parent ID.

✅ Output Requirements

Implement category assignment logic correctly.

Enforce record_kind and is_parent rules.

Update wizard behavior accordingly.

Keep existing APIs working.

No mock data.

Final working code only.