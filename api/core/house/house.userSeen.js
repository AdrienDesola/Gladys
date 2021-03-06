var queries = require('./house.queries.js');

module.exports = function userSeen(options) {

  // see if user is at home
  return gladys.utils.sql(queries.getLastEventHouseUser, [options.user, options.house])
    .then((rows) => {

      
      if(rows.length === 0) {

        // if user has never had events
        return gladys.event.create({code: 'back-at-home', user: options.user, house: options.house});
      } else if(rows[0].code === 'left-home') {

        // if user was not at home
        return gladys.event.create({code: 'back-at-home', user: options.user, house: options.house});
      } else if(rows[0].code === 'back-at-home') {
        
        // if user is at home, but has never been seen at home
        return gladys.event.create({code: 'user-seen-at-home', user: options.user, house: options.house});
      } else {

        // else, user has been seen at home so update
        var newEvent = {
          id: rows[0].id,
          datetime: new Date()
        };
        return gladys.event.update(newEvent);
      }
    })
    .then((event) => {
            
      // we save the new location of the user 
      // based on the latitude + longitude of his house
      return gladys.house.getById({id: options.house})
        .then((house) => {

          // if house has a latitude & a longitude
          if(house.latitude && house.longitude) {
            return gladys.location.create({
              latitude: house.latitude,
              longitude: house.longitude,
              accuracy: 0,
              user: options.user
            });
          } else {
            return null;
          }
        })
        .then(() => event);
    });
};