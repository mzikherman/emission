import * as React from "react"
import * as Relay from "react-relay"

import Artwork from "../artwork"
import InfiniteScrollArtworksGrid, {PageSize} from "../infinite_scroll_grid"

const SavedArtworks: React.SFC<any> = props => {
  console.log("GeneMapper:", props)
  return <InfiniteScrollArtworksGrid artworks_connection={props.gene.artworks}, relay={props.relay}, ...props/>
}

export default Relay.createContainer(SavedArtworks, {
  initialVariables: {
    totalSize: PageSize,
    medium: "*",
    priceRange: "*-*",
    sort: "-partner_updated_at",
  },
  fragments: {
    gene: () => Relay.QL`
      fragment on Gene {
        artworks: artworks_connection(sort: $sort,
                                      price_range: $priceRange,
                                      medium: $medium,
                                      first: $totalSize,
                                      for_sale: true) {
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
    `,
  },
})

export interface GeneRelayProps {
  gene: {
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
  },
}
