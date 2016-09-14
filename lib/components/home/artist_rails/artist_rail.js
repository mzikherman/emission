/* @flow */
'use strict'

import Relay from 'react-relay'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import Spinner from '../../spinner'

import SectionTitle from '../section_title'
import ArtistCard from './artist_card'
import Separator from '../../separator'
// import Routes from '../../../relay/routes'

class ArtistRail extends React.Component {
  state: {
    artists: [Object],
  }

  constructor(props) {
    super(props)
    this.state = {
      artists: []
    }
  }

  componentDidMount() {
    this.props.relay.setVariables({ fetchContent: true })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.rail.results) {
      this.setState({ artists: nextProps.rail.results.slice(0) })
    }
  }

  /**
   * Removes the followed artist from the list and re-renders.
   */
  handleFollowChange(artist) {
    // const artists = this.state.artists.slice(0)
    // artists[artists.indexOf(artist)] = { replace_id: artist._id }

    artist._replace = true
    this.setState({ artists: this.state.artists })
  }

  renderCard(artist) {
    // Compose key, because an artist may appear twice on the home view in different modules.
    const key = this.props.rail.__id + artist.__id
    return <ArtistCard key={key} artist={artist} onFollow={() => this.handleFollowChange(artist)} />
  }

  renderReplacementCard(artist) {
    const key = this.props.rail.__id + '-replace-' + artist._id
    return <Relay.Renderer key={key}
                            Container={SuggestedArtistContainer}
                            environment={Relay.Store}
                            queryConfig={{
                              name: 'SuggestedArtist',
                              params: { artistID: artist._id },
                              queries: {
                                suggested_artists: (component, params) => Relay.QL`
                                  query {
                                    me {
                                      ${component.getFragment('suggested_artists', params)}
                                    }
                                  }
                                `
                              },
                            }}
                            render={({done, error, replacementArtist, retry, stale}) => {
                              const index = this.state.artists.indexOf(artist)
                              if (error) {
                                console.log(error)
                                // Remove the card altogether.
                                this.state.artists.splice(index, 1)
                                return null
                              } else if (replacementArtist) {
                                // Replace the artist data and render a new card
                                this.state.artists[index] = replacementArtist
                                return this.renderCard(replacementArtist)
                              } else {
                                // While loading, still show the previous artist, but disabled.
                                return (
                                  <View style={{ backgroundColor: 'white', opacity: 0.5 }}>
                                    {this.renderCard(artist)}
                                  </View>
                                )
                              }
                            }} />
  }

  renderModuleResults() {
    if (this.state.artists.length > 0) {
      return this.state.artists.map(artist => {
        if (artist._replace) {
          return this.renderReplacementCard(artist)
        } else {
          return this.renderCard(artist)
        }
      })
    } else {
      return <Spinner style={{ flex: 1 }} />
    }
  }

  title() {
    switch (this.props.rail.key) {
      case 'TRENDING':
        return 'Artists to Follow: Trending'
      case 'SUGGESTED':
        return 'Artists to Follow: Recommended for You'
      case 'POPULAR':
        return 'Artists to Follow: Popular'
    }
  }

  render() {
    return (
      <View>
        <View style={styles.title}><SectionTitle>{ this.title() }</SectionTitle></View>
        <ScrollView style={styles.cardContainer}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    scrollsToTop={false}>
          {this.renderModuleResults()}
        </ScrollView>
      <Separator style={{marginTop: 5}}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 330,
    marginRight: 15,
  },
  title: {
    marginLeft: 30,
    marginRight: 30,
    marginTop: 15,
    marginBottom: 10
  }
})

class SuggestedArtist extends React.Component {
  render() {
    return <ArtistCard artist={this.props.suggested_artists[0]} />
  }
}

const SuggestedArtistContainer = Relay.createContainer(SuggestedArtist, {
  initialVariables: {
    artistID: null,
  },

  fragments: {
    suggested_artists: () => Relay.QL`
      fragment on Me {
        suggested_artists(artist_id: $artistID,
                          size: 1,
                          exclude_followed_artists: true,
                          exclude_artists_without_forsale_artworks: true) {
          ${ArtistFragment}
        }
      }
    `
  }
})

const ArtistFragment = Relay.QL`
  fragment on Artist {
    _id
    __id
    ${ArtistCard.getFragment('artist')}
  }
`

export default Relay.createContainer(ArtistRail, {
  initialVariables: {
    fetchContent: false,
  },

  fragments: {
    rail: () => Relay.QL`
      fragment on HomePageArtistModule {
        __id
        key
        results @include(if: $fetchContent) {
          ${ArtistFragment}
        }
      }
    `,
  }
})
