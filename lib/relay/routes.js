/* @flow */
'use strict'

import Relay from 'react-relay'

class Artist extends Relay.Route {
  static queries = {
    artist: (component, params) => Relay.QL`
      query {
        artist(id: $artistID) {
          ${component.getFragment('artist', params)}
        }
      }
    `,
  };

  static paramDefinitions = {
    artistID: { required: true },
  };

  static routeName = 'ArtistRoute';
}

class Home extends Relay.Route {
  static queries = {
    home: (component, params) => Relay.QL`
      query {
        home_page {
          ${component.getFragment('home', params)}
        }
      }
    `,
  };

  static routeName = 'HomeRoute';
}

// class SuggestedArtist extends Relay.Route {
//   static queries = {
//     artist = (component, params) => Relay.QL`
//       query {
//         me {
//           suggested_artists(artist_id: $artistID,
//                             size: 1,
//                             exclude_followed_artists: true,
//                             exclude_artists_without_forsale_artworks: true) {
//             ${component.getFragment('artist', params)}
//           }
//         }
//       }
//     `
//   }

//   static paramDefinitions = {
//     artistID: { required: true },
//   };

//   static routeName = 'SuggestedArtistRoute';
// }

export default {
  Artist,
  Home,
  // SuggestedArtist,
}
