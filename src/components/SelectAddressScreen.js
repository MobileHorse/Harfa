import React, { Component } from 'react';
import {
  View, Image, TextInput, Dimensions, StyleSheet, ActivityIndicator, Text,
  TouchableOpacity, ToastAndroid, BackHandler, StatusBar, Platform,
} from 'react-native';
import { colorPrimary, colorYellow, colorPrimaryDark, colorBg } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;

const GOOGLE_ADDRESS_SERVICE = "https://maps.googleapis.com/maps/api/place/autocomplete/json?key=AIzaSyAHu_ej6SvwW0vVbhu4A30OPayIAPFV030&types=geocode&language=en&input="
const LAT_LNG_URL = "https://maps.googleapis.com/maps/api/place/details/json?key=AIzaSyAHu_ej6SvwW0vVbhu4A30OPayIAPFV030&placeid=";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;

const StatusBarPlaceHolder = () => {
  return (
    Platform.OS === 'ios' ?
      <View style={{
        width: "100%",
        height: STATUS_BAR_HEIGHT,
        backgroundColor: colorPrimaryDark
      }}>
        <StatusBar
          barStyle="light-content" />
      </View>
      :
      <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} />
  );
}

export default class SelectAddressScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      dataSource: [],
      isLoading: false,
      address: '',
      lat: 0,
      lng: 0,
    };
  };

  componentWillMount() {
    const { navigation } = this.props;
    navigation.addListener('willFocus', async () => {
      BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
    });
    navigation.addListener('willBlur', () => {
      BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    });
  }

  handleBackButtonClick = () => {
    this.props.navigation.goBack();
    return true;
  }

  getAddress = value => {
    this.setState({
      isLoading: true,
    });
    fetch(GOOGLE_ADDRESS_SERVICE + value)
      .then((response) => response.json())
      .then((responseJson) => {

        console.log("Response : " + JSON.stringify(responseJson));
        this.setState({
          dataSource: responseJson.predictions,
          isLoading: false
        })
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          isLoading: false
        })
        ToastAndroid.show('Something went wrong, Check your internet connection', ToastAndroid.SHORT);
      })
  }

  moveToPreviousScreen = (placeId, description) => {
    this.setState({
      isLoading: true,
    });
    fetch(LAT_LNG_URL + placeId)
      .then((response) => response.json())
      .then((responseJson) => {

        console.log("Response : " + JSON.stringify(responseJson.result.geometry.location.lat));
        this.setState({
          isLoading: false,
          address: description,
          lat: responseJson.result.geometry.location.lat,
          lng: responseJson.result.geometry.location.lng
        });
        this.props.navigation.state.params.onGoBack(this.state.address + "/" + this.state.lat + "/" + this.state.lng);
        this.props.navigation.goBack();
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          isLoading: false
        })
        ToastAndroid.show('Something went wrong, Check your internet connection', ToastAndroid.SHORT);
      });
  }

  //GridView Items
  renderItem = (item, index) => {
    return (
      <TouchableOpacity key={index} style={styles.itemHeader}
        onPress={() => this.moveToPreviousScreen(item.place_id, item.description)}>
        <View style={styles.touchaleHighlight}>
          <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
            source={require('../icons/maps_location.png')} />
        </View>
        <Text style={styles.itemText}>{item.description}</Text>
      </TouchableOpacity>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View style={styles.header}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center', }}
              onPress={() => this.props.navigation.goBack()}>
              <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                source={require('../icons/arrow_back.png')} />
            </TouchableOpacity>
            <Text style={{ color: 'white', fontWeight: 'bold', alignSelf: 'center', marginLeft: 1 }}>

            </Text>
          </View>
        </View>
        <View style={{
          flexDirection: 'row', width: '100%', height: 70, backgroundColor: colorYellow,
          paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, justifyContent: 'center',
        }}>
          <View style={{
            flexDirection: 'row', width: screenWidth - 20, height: 50, justifyContent: 'center',
            alignItems: 'center', borderRadius: 5, backgroundColor: 'white', shadowColor: '#000',
            shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 5,
            elevation: 5,
          }}>
            <Image style={{ width: 15, height: 15, marginLeft: 20 }}
              source={require('../icons/search.png')} />
            <TextInput style={{ width: screenWidth - 60, height: 45, fontSize: 16, fontWeight: 'bold', marginLeft: 10 }}
              onChangeText={(value) => this.getAddress(value)}
              placeholder='Enter your address...'>
            </TextInput>
          </View>
        </View>
        <View style={styles.listView}>
            {this.state.dataSource.map(this.renderItem)}
        </View>

        {this.state.isLoading && (
          <View style={styles.loaderStyle}>
            <ActivityIndicator
              style={{ height: 80 }}
              color="#C00"
              size="large" />
          </View>
        )}


      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colorBg
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: colorPrimary,
    paddingLeft: 10,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  listView: {
    flex: 1,
    backgroundColor: colorBg,
    padding: 5,
  },
  itemHeader: {
    flex: 1,
    width: screenWidth,
    height: 50,
    flexDirection: 'row',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
  },
  touchaleHighlight: {
    width: 30,
    height: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
    alignSelf: 'center',
    alignContent: 'center',
    marginLeft: 5,
  },
  itemText: {
    width: screenWidth - 50,
    fontSize: 14,
    color: 'black',
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  }
});