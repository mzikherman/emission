import React, { Component } from "react"
import { createRefetchContainer, graphql, RelayRefetchProp } from "react-relay"

import { Animated, Easing, ScrollView, StyleSheet, TextStyle, View, ViewProperties, ViewStyle } from "react-native"

import metaphysics from "../../../metaphysics"

import { Disposable } from "relay-runtime"
import Separator from "../../Separator"
import Spinner from "../../Spinner"
import SectionTitle from "../SectionTitle"
import ArtistCard, { ArtistCardQuery, ArtistCardResponse, ArtistFollowButtonStatusSetter } from "./ArtistCard"

const Animation = {
  yDelta: 20,
  duration: {
    followedArtist: 500,
    suggestedArtist: 400,
  },
  easing: Easing.out(Easing.cubic),
}

interface Props extends ViewProperties, RelayProps {
  registerRailModule?: (rail: ArtistRail | null) => void
  relay?: RelayRefetchProp
}

interface State {
  artists: any[]
  loadFailed: boolean
}

export class ArtistRail extends Component<Props, State> {
  inflightRequest: Disposable

  state = {
    artists: [],
    loadFailed: false,
  }

  componentWillMount() {
    if (this.props.registerRailModule) {
      this.props.registerRailModule(this)
    }
  }

  async componentDidMount() {
    await this.refreshData()
  }

  componentWillUnmount() {
    if (this.props.registerRailModule) {
      this.props.registerRailModule(null)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.rail.results) {
      const artists = nextProps.rail.results.map(artist =>
        Object.assign(
          {
            _animatedValues: {
              opacity: new Animated.Value(1),
              translateY: new Animated.Value(0),
            },
          },
          artist
        )
      )
      this.setState({ artists })
    }
  }

  followedArtistAnimation(followedArtist) {
    return new Promise((resolve, _reject) => {
      const { opacity, translateY } = followedArtist._animatedValues
      const duration = Animation.duration.followedArtist
      const easing = Animation.easing
      Animated.parallel([
        Animated.timing(opacity, { duration, easing, toValue: 0 }),
        Animated.timing(translateY, { duration, easing, toValue: Animation.yDelta }),
      ]).start(resolve)
    })
  }

  suggestedArtistAnimation(suggestedArtist: SuggestedArtist) {
    return new Promise((resolve, _reject) => {
      const { opacity, translateY } = suggestedArtist._animatedValues
      const duration = Animation.duration.suggestedArtist
      const easing = Animation.easing
      Animated.parallel([
        Animated.timing(opacity, { duration, easing, toValue: 1 }),
        Animated.timing(translateY, { duration, easing, toValue: 0 }),
      ]).start(resolve)
    })
  }

  replaceFollowedArtist(followedArtist, suggestedArtist: SuggestedArtist): Promise<undefined> {
    const artists = this.state.artists.slice(0)
    const index = artists.indexOf(followedArtist)
    if (suggestedArtist) {
      suggestedArtist._animatedValues = {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(-Animation.yDelta),
      }
      artists[index] = suggestedArtist
    } else {
      // remove card when there is no suggestion
      artists.splice(index, 1)
    }
    // Resolve after re-render
    return new Promise((resolve, _) => {
      this.setState({ artists }, resolve)
    })
  }

  handleFollowChange(followArtist, setFollowButtonStatus: ArtistFollowButtonStatusSetter) {
    // Get a new suggested artist based on the followed artist.
    return (
      metaphysics<SuggestedArtistResponse>(suggestedArtistQuery(followArtist._id))
        // Return the suggested artist or `undefined` if there is no suggestion.
        .then(({ me: { suggested_artists } }) => suggested_artists[0])
        // Return `undefined` if an error occurred.
        .catch(error => console.warn(error))
        // Change the status of the follow button to ‘following’.
        .then(suggestedArtist => setFollowButtonStatus(true).then(() => suggestedArtist))
        // Animate the followed artist card away.
        .then(suggestedArtist => this.followedArtistAnimation(followArtist).then(() => suggestedArtist))
        // Replace the followed artist by the suggested one in the list of artists.
        .then(suggestedArtist =>
          this.replaceFollowedArtist(followArtist, suggestedArtist as SuggestedArtist).then(() => suggestedArtist)
        )
        // Finally animate the suggested artist card in, if there is a suggestion.
        .then(suggestedArtist => suggestedArtist && this.suggestedArtistAnimation(suggestedArtist))
    )
  }

  renderModuleResults() {
    if (this.state.artists.length > 0) {
      const cards = this.state.artists.map(artist => {
        // Compose key, because an artist may appear twice on the home view in different modules.
        const key = this.props.rail.__id + artist.__id
        const { opacity, translateY } = artist._animatedValues
        const style = { opacity, transform: [{ translateY }] }
        return (
          <Animated.View key={key} style={style}>
            <ArtistCard artist={artist} onFollow={setter => this.handleFollowChange(artist, setter)} />
          </Animated.View>
        )
      })
      return (
        <ScrollView
          style={styles.cardContainer}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          scrollsToTop={false}
        >
          {cards}
          {
            // Adding a spacer view to have padding at the end of the rail
            // If you add marginRight, it will cut off the cards as you scroll through
          }
          <View style={{ width: 15 }} />
        </ScrollView>
      )
    } else {
      return <Spinner style={{ flex: 1, marginBottom: 20 }} />
    }
  }

  title() {
    return "Artists to Follow:"
  }
  subtitle() {
    switch (this.props.rail.key) {
      case "TRENDING":
        return "Trending on Artsy"
      case "SUGGESTED":
        return "Recommended for You"
      case "POPULAR":
        return "Popular on Artsy"
    }
  }

  refreshData = () => {
    if (this.inflightRequest) {
      this.inflightRequest.dispose()
    }

    return new Promise((resolve, reject) => {
      this.inflightRequest = this.props.relay.refetch({ ...this.props.rail, fetchContent: true }, null, error => {
        if (error) {
          console.error("ArtistRail.jsx", error.message)

          this.setState({
            loadFailed: true,
          })

          reject(error)
        } else {
          this.inflightRequest = null
          resolve()
        }
      })
    })
  }

  render() {
    if (this.state.loadFailed || !this.state.artists.length) {
      return null
    }

    return (
      <View>
        <View style={styles.title}>
          <SectionTitle>{this.title()}</SectionTitle>
          <SectionTitle style={styles.subtitle}>{this.subtitle()}</SectionTitle>
        </View>
        {this.renderModuleResults()}
        <Separator />
      </View>
    )
  }
}

interface Styles {
  cardContainer: ViewStyle
  title: ViewStyle
  subtitle: TextStyle
}

const styles = StyleSheet.create<Styles>({
  cardContainer: {
    flexGrow: 1,
    flexDirection: "row",
    marginTop: 10,
    minHeight: 320,
  },
  title: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 30,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: "AGaramondPro-Regular",
  },
})

interface SuggestedArtist extends ArtistCardResponse {
  _id: string
  __id: string
  _animatedValues?: {
    opacity: Animated.Value
    translateY: Animated.Value
  }
}

interface SuggestedArtistResponse {
  me: {
    suggested_artists: SuggestedArtist[]
  }
}

function suggestedArtistQuery(artistID: string): string {
  return `
    query {
      me {
        suggested_artists(artist_id: "${artistID}",
                          size: 1,
                          exclude_followed_artists: true,
                          exclude_artists_without_forsale_artworks: true) {
          _id
          __id
          ${ArtistCardQuery}
        }
      }
    }
  `
}

export default createRefetchContainer(
  ArtistRail,
  graphql.experimental`
    fragment ArtistRail_rail on HomePageArtistModule
      @argumentDefinitions(fetchContent: { type: "Boolean!", defaultValue: false }) {
      __id
      key
      results @include(if: $fetchContent) {
        _id
        __id
        ...ArtistCard_artist
      }
    }
  `,
  graphql.experimental`
    query ArtistRailRefetchQuery($__id: ID!, $fetchContent: Boolean!) {
      node(__id: $__id) {
        ...ArtistRail_rail @arguments(fetchContent: $fetchContent)
      }
    }
  `
)

interface RelayProps {
  rail: {
    __id: string
    key: string | null
    results: Array<{
      _id: string
      __id: string
    } | null> | null
  }
}
