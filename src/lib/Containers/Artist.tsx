import React, { Component } from "react"
import { createFragmentContainer, graphql } from "react-relay"

import { Dimensions, ScrollView, StyleSheet, View, ViewProperties, ViewStyle } from "react-native"

import About from "lib/Components/Artist/About"
import Artworks from "lib/Components/Artist/Artworks"
import Header from "lib/Components/Artist/Header"
import Shows from "lib/Components/Artist/Shows"
import Events from "lib/NativeModules/Events"

import { SwitchEvent } from "lib/Components/SwitchView"
import TabView from "lib/Components/TabView"

const isPad = Dimensions.get("window").width > 700

const TABS = {
  ABOUT: "ABOUT",
  WORKS: "WORKS",
  SHOWS: "SHOWS",
}

export class Artist extends Component<RelayProps & ViewProperties> {
  state: {
    selectedTabIndex: number
  }

  componentWillMount() {
    const worksTab = this.availableTabs().indexOf(TABS.WORKS)
    if (worksTab > -1) {
      this.state = { selectedTabIndex: worksTab }
    } else {
      this.state = { selectedTabIndex: 0 }
    }
  }

  tabSelectionDidChange = (event: SwitchEvent) => {
    this.setState({ selectedTabIndex: event.nativeEvent.selectedIndex })
  }

  availableTabs = () => {
    const tabs: string[] = []
    const artist = this.props.artist
    const displayAboutSection = artist.has_metadata || artist.counts.articles > 0 || artist.counts.related_artists > 0

    if (displayAboutSection) {
      tabs.push(TABS.ABOUT)
    }

    if (artist.counts.artworks) {
      tabs.push(TABS.WORKS)
    }

    if (artist.counts.partner_shows) {
      tabs.push(TABS.SHOWS)
    }
    return tabs
  }

  selectedTabTitle = () => {
    return this.availableTabs()[this.state.selectedTabIndex]
  }

  // This is *not* called on the initial render, thus it will only post events for when the user actually taps a tab.
  componentDidUpdate() {
    Events.postEvent({
      name: "Tapped artist view tab",
      tab: this.selectedTabTitle().toLowerCase(),
      artist_id: this.props.artist._id,
      artist_slug: this.props.artist.id,
    })
  }

  renderSelectedTab = () => {
    switch (this.selectedTabTitle()) {
      case TABS.ABOUT:
        return <About artist={this.props.artist} />
      case TABS.WORKS:
        return <Artworks artist={this.props.artist} />
      case TABS.SHOWS:
        return <Shows artist={this.props.artist} />
    }
  }

  renderTabView() {
    return (
      <TabView
        titles={this.availableTabs()}
        selectedIndex={this.state.selectedTabIndex}
        onSelectionChange={this.tabSelectionDidChange}
        style={styles.tabView}
      >
        {this.renderSelectedTab()}
      </TabView>
    )
  }

  renderSingleTab() {
    return <View style={{ paddingTop: 30 }}>{this.renderSelectedTab()}</View>
  }

  render() {
    const windowDimensions = Dimensions.get("window")
    const commonPadding = windowDimensions.width > 700 ? 40 : 20
    const displayTabView = this.availableTabs().length > 1

    return (
      <ScrollView scrollsToTop={true} automaticallyAdjustContentInsets={false}>
        <View style={{ paddingLeft: commonPadding, paddingRight: commonPadding }}>
          <Header artist={this.props.artist} />
          {displayTabView ? this.renderTabView() : this.renderSingleTab()}
        </View>
      </ScrollView>
    )
  }
}

interface Styles {
  tabView: ViewStyle
}

const styles = StyleSheet.create<Styles>({
  tabView: {
    width: isPad ? 330 : null,
    marginTop: 30,
    marginBottom: 30,
    alignSelf: isPad ? "center" : null,
  },
})

export default createFragmentContainer(
  Artist,
  graphql`
    fragment Artist_artist on Artist {
      _id
      id
      has_metadata
      counts {
        artworks
        partner_shows
        related_artists
        articles
      }
      ...Header_artist
      ...About_artist
      ...Shows_artist
      ...Artworks_artist
    }
  `
)

interface RelayProps {
  artist: {
    _id: string | null
    id: string | null
    birthday: string | null
    counts: {
      articles: boolean | number | string | null
      artworks: boolean | number | string | null
      follows: boolean | number | string | null
      partner_shows: boolean | number | string | null
      related_artists: boolean | number | string | null
      for_sale_artworks: boolean | number | string | null
    } | null
    has_metadata: boolean | null
    name: string | null
    nationality: string | null
    current_shows: Array<boolean | number | string | null> | null
    upcoming_shows: Array<boolean | number | string | null> | null
    past_small_shows: Array<boolean | number | string | null> | null
    past_large_shows: Array<{
      __id: string | null
    }> | null
  }
}
