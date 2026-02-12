const { Property } = require('./models');
Property.describe()
  .then(d => {
    console.log(JSON.stringify(d, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
