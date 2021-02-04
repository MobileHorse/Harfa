import React, { Component } from 'react';
import {
  Text, StyleSheet, View, Image, ActivityIndicator, TouchableOpacity,
  ToastAndroid, StatusBar, Platform
} from 'react-native';
import CheckBox from 'react-native-check-box';
import Config from './Config';
import { colorYellow, colorPrimaryDark, colorBg, colorPrimary } from '../Constants/colors';

const SERVICES_URL = Config.baseURL + 'service/getall';
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

export default class ProServiceSelectScreen extends Component {
  constructor(props) {
    super();
    this.state = {
      dataSource: [],
      selectedServiceId: [],
      selectedServiceName: [],
      isLoading: true,
    }
  }

  onCheckBoxPress = (id, serviceName) => {
    let tmpId = this.state.selectedServiceId;
    let tmpName = this.state.selectedServiceName;

    if (tmpId.includes(id)) {
      tmpId.splice(tmpId.indexOf(id), 1);
      tmpName.splice(tmpName.indexOf(serviceName))
    } else {
      tmpId.push(id);
      tmpName.push(serviceName)
    }

    this.setState({
      selectedServiceId: tmpId,
      selectedServiceName: tmpName
    });
  }

  renderItem = (item, index) => {
    return (
      <View key={index} style={styles.header}>
        <View
          style={styles.touchaleHighlight}>
          <Image style={{ width: 25, height: 25 }}
            source={{ uri: item.image }} />
        </View>
        <Text style={styles.textHeader}> {item.service_name}</Text>

        <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
          <CheckBox style={{ alignSelf: 'flex-end', marginRight: 20, }}
            isChecked={this.state.selectedServiceId.includes(item.id) ? true : false}
            onClick={() => this.onCheckBoxPress(item.id, item.service_name)} />
        </View>
      </View>
    )
  }

  //Get All Services
  componentDidMount() {
    fetch(SERVICES_URL)
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({
          dataSource: responseJson.data,  //data is key
          isLoading: false
        })
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          isLoading: false
        })
        ToastAndroid.show('Something went wrong, Check your internet connection', ToastAndroid.SHORT);
      });
  }

  checkValidation = () => {
    if (this.state.selectedServiceId.length > 0) {
      this.props.navigation.state.params.onGoBack(this.state.selectedServiceId + "/" + this.state.selectedServiceName);
      this.props.navigation.goBack();
    }
    else {
      ToastAndroid.show('Select atleast one services', ToastAndroid.SHORT);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBarPlaceHolder />
        <View style={{
          flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
          paddingLeft: 10, paddingRight: 20, paddingTop: 5, paddingBottom: 5
        }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center', }}
              onPress={() => this.props.navigation.goBack()}>
              <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                source={require('../icons/arrow_back.png')} />
            </TouchableOpacity>

            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', alignSelf: 'center', marginLeft: 10 }}>
              Services
              </Text>
          </View>
        </View>

        <View style={styles.gridView}>
          {this.state.dataSource.map(this.renderItem)}
        </View>

        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={styles.buttonContainer}
            onPress={this.checkValidation}>
            <Text style={styles.text}>
              Submit
              </Text>
          </TouchableOpacity>
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
    backgroundColor: colorBg,
  },
  header: {
    flex: 1,
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
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 15,
  },
  textHeader: {
    fontSize: 14,
    color: 'black',
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  buttonContainer: {
    width: 200,
    paddingTop: 10,
    backgroundColor: '#000000',
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    borderColor: colorYellow,
    borderWidth: 2,
    marginBottom: 10,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridView: {
    flex: 1,
    backgroundColor: colorBg,
    padding: 5,
  },
  open: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuIcon: {
    width: 22,
    height: 22,
  },
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
});
