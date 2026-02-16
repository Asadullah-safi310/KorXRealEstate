const PERMISSIONS = {
    ADD_PROPERTY: 'ADD_PROPERTY',
    MY_PROPERTIES: 'MY_PROPERTIES',
    MY_TOWERS: 'MY_TOWERS',
    MY_MARKETS: 'MY_MARKETS',
    MY_SHARAKS: 'MY_SHARAKS',
    TRANSACTION_HISTORY: 'TRANSACTION_HISTORY',

    // Category permission map used by controllers
    NORMAL: {
        CREATE: 'ADD_PROPERTY',
        READ: 'MY_PROPERTIES',
        UPDATE: 'MY_PROPERTIES',
        DELETE: 'MY_PROPERTIES',
    },
    TOWER: {
        PARENT_CREATE: 'MY_TOWERS',
        CHILD_CREATE: 'ADD_PROPERTY',
        READ: 'MY_TOWERS',
    },
    MARKET: {
        PARENT_CREATE: 'MY_MARKETS',
        CHILD_CREATE: 'ADD_PROPERTY',
        READ: 'MY_MARKETS',
    },
    SHARAK: {
        PARENT_CREATE: 'MY_SHARAKS',
        CHILD_CREATE: 'ADD_PROPERTY',
        READ: 'MY_SHARAKS',
    },
};

const PERMISSION_DISPLAY_NAMES = {
    [PERMISSIONS.ADD_PROPERTY]: 'Add Property',
    [PERMISSIONS.MY_PROPERTIES]: 'My Properties',
    [PERMISSIONS.MY_TOWERS]: 'My Towers',
    [PERMISSIONS.MY_MARKETS]: 'My Markets',
    [PERMISSIONS.MY_SHARAKS]: 'My Sharaks',
    [PERMISSIONS.TRANSACTION_HISTORY]: 'Transaction History',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (value && typeof value === 'object') return Object.values(value);
    return [];
});

module.exports = { PERMISSIONS, PERMISSION_DISPLAY_NAMES, ALL_PERMISSIONS };
