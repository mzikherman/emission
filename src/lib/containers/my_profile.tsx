import * as React from "react"
import * as Relay from "react-relay"

import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  ViewProperties,
  ViewStyle,
} from "react-native"

import Headline from "../components/text/headline"

import Artworks from "../components/artwork_grids/relay_connections/saved_artworks_grid"
import { SwitchEvent } from "../components/switch_view"
import TabView from "../components/tab_view"

const isPad = Dimensions.get("window").width > 700

interface Props extends ViewProperties, RelayProps {}

export class MyProfile extends React.Component<Props, {}> {
  state: {
    selectedTabIndex: number,
  }

  render() {
    const windowDimensions = Dimensions.get("window")
    const commonPadding = windowDimensions.width > 700 ? 40 : 20

    return (
      <ScrollView scrollsToTop={true} automaticallyAdjustContentInsets={false}>
        <View style={{ paddingLeft: commonPadding, paddingRight: commonPadding }}>
          <Headline>{this.props.me.name}</Headline>
          <Artworks queryKey="me" me={this.props.me}/>
        </View>
      </ScrollView>
    )
  }
}

interface Styles {
  tabView: ViewStyle,
}

const styles = StyleSheet.create<Styles>({
  tabView: {
    width: isPad ? 330 : null,
    marginTop: 30,
    marginBottom: 30,
    alignSelf: isPad ? "center" : null,
  },
})

export default Relay.createContainer(MyProfile, {
  fragments: {
    me: () => Relay.QL`
      fragment on Me {
        name
        ${Artworks.getFragment("artworks")}
      }
    `,
  },
})

interface RelayProps {
  me: {
    name: string | null,
  },
}
