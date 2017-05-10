import * as React from "react"
import * as Relay from "react-relay"

import Artwork from "../artwork"
import InfiniteScrollArtworksGrid, {PageSize} from "../infinite_scroll_grid"

const SavedArtworks: React.SFC<any> = props => {
  console.log(props)
  return <InfiniteScrollArtworksGrid queryKey="me" artworks={[]}, relay: {props.relay}, ...props />
}

export default Relay.createContainer(SavedArtworks, {
  initialVariables: {
    totalSize: PageSize,
  },

  fragments: {
    artworks: () => Relay.QL`
      fragment on Me {
        artworks:
          saved_artworks {
            artworks_connection(first: $totalSize) {
              pageInfo {
                hasNextPage
              }
              edges {
                node {
                  __id
                  image {
                    aspect_ratio
                  }
                  ${Artwork.getFragment("artwork")}
                }
              }
            }
          }
      }
    `,
  },
})

export interface SavedArtworksRelayProps {
  me: {
    saved_artworks: {
      artworks_connection: {
        pageInfo: {
          hasNextPage: boolean,
        },
        edges: Array<{
          node: {
            __id: string,
            image: {
              aspect_ratio: number | null,
            } | null,
          } | null,
        }>,
      } | null,
    } | null,
  },
}
