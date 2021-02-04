import React, { Component } from 'react';
import {
  View, StyleSheet, Dimensions, Image, Text, TouchableOpacity, Linking,
  BackHandler, Alert, StatusBar, Platform, ActivityIndicator
} from 'react-native';
//import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview'
import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';
import simpleToast from 'react-native-simple-toast';
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import LinearGradient from 'react-native-linear-gradient';
import SlidingPanel from 'react-native-sliding-up-down-panels';
import { startFetchingJobCustomer, fetchedJobCustomerInfo, fetchCustomerJobInfoError, setSelectedJobRequest } from '../Redux/Actions/jobsActions';
import { MAPS_API_KEY } from 'react-native-dotenv';
import Config from './Config';

//const colorPrimary = '#FFBF0F';
const colorPrimaryDark = '#C5940E';
const colorYellow = '#FFBF0F';
const colorBg = '#E8EEE9';
//const colorGray = '#C0C0C0'

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight;
const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";

function StatusBarPlaceHolder() {
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

class MapDirectionScreen extends Component {

  constructor(props) {
    super();
    const { userInfo: { userDetails }, generalInfo: { usersCoordinates, othersCoordinates }, jobsInfo: { jobRequests, selectedJobRequest: { employee_id } }, navigation } = props;
    var currRequestPos = navigation.getParam('currentPos', 0);
    const employeeLatitude = othersCoordinates[employee_id] ? othersCoordinates[employee_id].latitude : usersCoordinates.latitude;
    const employeeLongitude = othersCoordinates[employee_id] ? othersCoordinates[employee_id].longitude : usersCoordinates.longitude;

    this.state = {
      sourceLocation: employeeLatitude + "," + employeeLongitude,
      sourceLat: parseFloat(employeeLatitude),
      sourceLng: parseFloat(employeeLongitude),
      destinationLocation: usersCoordinates.latitude + ',' + usersCoordinates.longitude,
      destinationLat: parseFloat(usersCoordinates.latitude),
      destinationLng: parseFloat(usersCoordinates.longitude),
      coords: [],
      isLoading: true,

      senderId: userDetails.userId,
      senderImage: userDetails.image,
      senderName: userDetails.username,
      inputMessage: '',
      dataChatSource: [],
      currRequestPos,
      //From DashboardScreen && ProviderDetailsScreen
      id: jobRequests[currRequestPos].id,
      orderId: jobRequests[currRequestPos].order_id,
      providerId: jobRequests[currRequestPos].employee_id,
      providerImage: jobRequests[currRequestPos].image,
      providerfcmId: jobRequests[currRequestPos].fcm_id,
      providerName: jobRequests[currRequestPos].name + " " + jobRequests[currRequestPos].surName,
      providerMobile: jobRequests[currRequestPos].mobile,
      providerDescription: jobRequests[currRequestPos].description,
      providerAddress: jobRequests[currRequestPos].address,
      providerLat: jobRequests[currRequestPos].lat,
      providerLang: jobRequests[currRequestPos].lang,
      serviceName: jobRequests[currRequestPos].service_name,
      isJobAccepted: jobRequests[currRequestPos].status === 'Accepted',
      titlePage: navigation.state.params.titlePage,
      mapKey: Math.random(2),
      fcm_id: jobRequests[currRequestPos].fcm_id,
      employeeLocationFetched: othersCoordinates[employee_id] ? true : false
    };
  };

  componentDidMount() {
    const { generalInfo: { othersCoordinates, usersCoordinates }, jobsInfo: { selectedJobRequest: { employee_id } }, navigation } = this.props;
    const employeeLatitude = othersCoordinates[employee_id] ? othersCoordinates[employee_id].latitude : usersCoordinates.latitude;
    const employeeLongitude = othersCoordinates[employee_id] ? othersCoordinates[employee_id].longitude : usersCoordinates.longitude;
    this.getDirections(employeeLatitude + "," + employeeLongitude, this.state.destinationLocation);

    navigation.addListener('willFocus', async () => {
      this.refetchDirections()
      BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
    });
    navigation.addListener('willBlur', () => {
      BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    });
  }

  refetchDirections = () => {
    const { generalInfo: { usersCoordinates, othersCoordinates }, jobsInfo: { selectedJobRequest: { employee_id } } } = this.props;
    const { latitude, longitude } = othersCoordinates[employee_id] || {};
    const { destinationLat, destinationLng, coords } = this.state;
    if (latitude !== undefined && longitude !== undefined) {
      if (Math.floor(parseInt(latitude)) !== Math.floor(parseInt(destinationLat)) || Math.floor(parseInt(longitude)) !== Math.floor(parseInt(destinationLng))) {
        this.setState({
          sourceLocation: latitude + "," + longitude,
          sourceLat: parseFloat(latitude),
          sourceLng: parseFloat(longitude),
          destinationLocation: usersCoordinates.latitude + ',' + usersCoordinates.longitude,
          destinationLat: parseFloat(usersCoordinates.latitude),
          destinationLng: parseFloat(usersCoordinates.longitude),
        });
        this.getDirections(latitude + "," + longitude, this.state.destinationLocation);
      }
    }
    if (this.state.coords.length === 0) {
      this.getDirections(latitude + "," + longitude, this.state.destinationLocation);
    }
    else {
      let actualLat1 = coords[0].latitude;
      let actualLong1 = coords[0].longitude;
      if (actualLat1 && actualLong1 && !this.state.keyReset) this.setState({ mapKey: Math.random(2), keyReset: true });
    }
  }

  handleBackButtonClick = () => {
    if (this.state.titlePage == "Dashboard")
      this.props.navigation.navigate("Dashboard");
    else if (this.state.titlePage == "ProviderDetails")
      this.props.navigation.navigate("ProviderDetails");
    else if (this.state.titlePage == "Chat")
      this.props.navigation.navigate("Chat");
    else
      this.props.navigation.goBack()
    return true
  }


  async getDirections(startLoc, destinationLoc) {
    if (startLoc && destinationLoc) {
      try {
        fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${MAPS_API_KEY}`).
          then(resp => resp.json()).
          then(respJson => {
            if (respJson && respJson.routes[0]) {
              let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
              let coords = points.map((point, index) => {
                return {
                  latitude: point[0],
                  longitude: point[1]
                }
              });
              //If Delay some second, works fine..Reason don't know
              setTimeout(() => {
                this.setState({
                  coords: coords,
                  isLoading: false,
                });
                return coords
              }, 1500)
            }
          });
      } catch (error) {
        alert(error)
        return error
      }
    }
    else {
      simpleToast.show('Destination co-ordinates missing, try later', simpleToast.LONG);
    }
  }

  callPhoneTask = () => {
    Linking.openURL('tel:' + this.state.providerMobile)
  }

  openCompleteConfirmation = () => {
    Alert.alert(
      "COMPLETED",
      "Was the job completed successfully?",
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => { this.jobCompleteTask() },
        },
      ]
    );
  }

  openCancelConfirmation = () => {
    Alert.alert(
      "CANCEL JOB REQUEST",
      "Are you sure you want to cancel the job request?",
      [
        {
          text: 'No',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => { this.jobCancelTask() },
        },
      ]
    );
  }

  jobCancelTask = () => {
    this.setState({ isLoading: true });
    const { fetchedPendingJobInfo, jobsInfo: { jobRequests } } = this.props;
    const { currRequestPos } = this.state;
    var newJobRequests = [...jobRequests];
    const data = {
      main_id: jobRequests[currRequestPos].id,
      chat_status: '1',
      status: 'Canceled',
      'notification': {
        "fcm_id": jobRequests[currRequestPos].fcm_id,
        "title": "Job Canceled",
        "type": "JobCancellation",
        "notification_by": "Customer",
        "body": 'Job request has been canceled by client' + ' Request Id : ' + jobRequests[currRequestPos].order_id,
        "data": {
          user_id: this.state.senderId,
          providerId: jobRequests[currRequestPos].employee_id,
          image: jobRequests[currRequestPos].image,
          fcmId: jobRequests[currRequestPos].fcm_id,
          name: jobRequests[currRequestPos].name,
          surname: jobRequests[currRequestPos].surname,
          mobile: jobRequests[currRequestPos].mobile,
          description: jobRequests[currRequestPos].description,
          address: jobRequests[currRequestPos].address,
          lat: jobRequests[currRequestPos].lat,
          lang: jobRequests[currRequestPos].lang,
          serviceName: jobRequests[currRequestPos].service_name,
          orderId: jobRequests[currRequestPos].order_id,
          mainId: jobRequests[currRequestPos].id,
          chat_status: jobRequests[currRequestPos].chat_status,
          status: 'Canceled',
          delivery_address: jobRequests[currRequestPos].delivery_address,
          delivery_lat: jobRequests[currRequestPos].delivery_lat,
          delivery_lang: jobRequests[currRequestPos].delivery_lang,
        },
      }
    }

    fetch(REJECT_ACCEPT_REQUEST, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.result) {
          this.setState({
            isLoading: false,
            isAcceptJob: true,
          });
          newJobRequests.splice(currRequestPos, 1);
          fetchedPendingJobInfo(newJobRequests);
          this.props.navigation.navigate("Dashboard");
        }
        else {
          Alert.alert("OOPS!", "Something went wrong, try again later");
          this.setState({
            isLoading: false,
          });
        }
      })
      .catch((error) => {
        console.log("Error >>> " + error);
        this.setState({
          isLoading: false,
        });
      })
  }

  jobCompleteTask = () => {
    this.setState({
      isLoading: true
    })
    const { fetchedPendingJobInfo, jobsInfo: { jobRequests }, userInfo: { userDetails } } = this.props;
    const { currRequestPos } = this.state;
    var newJobRequests = cloneDeep(jobRequests);
    const data = {
      main_id: jobRequests[currRequestPos].id,
      chat_status: '1',
      status: 'Completed',
      'notification': {
        "fcm_id": jobRequests[currRequestPos].fcm_id,
        "title": "Job Completed",
        "body": 'Your job request has been completed by ' + ' Request Id : ' + jobRequests[currRequestPos].order_id,
        "type": "Job Completed",
        "notification_by": "Client",
        "data": {
          providerId: jobRequests[currRequestPos].employee_id,
          user_id: userDetails.userId,
          image: jobRequests[currRequestPos].image,
          fcmId: jobRequests[currRequestPos].fcm_id,
          name: jobRequests[currRequestPos].name,
          surname: jobRequests[currRequestPos].surname,
          mobile: jobRequests[currRequestPos].mobile,
          description: jobRequests[currRequestPos].description,
          address: jobRequests[currRequestPos].address,
          lat: jobRequests[currRequestPos].lat,
          lang: jobRequests[currRequestPos].lang,
          serviceName: jobRequests[currRequestPos].service_name,
          orderId: jobRequests[currRequestPos].order_id,
          mainId: jobRequests[currRequestPos].id,
          chat_status: jobRequests[currRequestPos].chat_status,
          status: jobRequests[currRequestPos].status,
          delivery_address: jobRequests[currRequestPos].delivery_address,
          delivery_lat: jobRequests[currRequestPos].delivery_lat,
          delivery_lang: jobRequests[currRequestPos].delivery_lang,
        },
      }
    }

    fetch(REJECT_ACCEPT_REQUEST, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.result) {
          this.setState({
            isLoading: false,
            isAcceptJob: true,
          });
          newJobRequests.splice(currRequestPos, 1);
          fetchedPendingJobInfo(newJobRequests);
          this.props.navigation.navigate("Dashboard");
        }
        else {
          Alert.alert("OOPS!", "Something went wrong, try again later");
          this.setState({
            isLoading: false,
          });
        }
      })
      .catch((error) => {
        console.log("Error >>> " + error);
        this.setState({
          isLoading: false,
        });
      })
  }

  render() {
    const { userInfo: { userDetails }, jobsInfo: { jobRequests, selectedJobRequest: { employee_id } }, generalInfo: { othersCoordinates } } = this.props;
    const {
      currRequestPos,
      sourceLat,
      sourceLng,
      destinationLat,
      destinationLng,
      coords,
      providerName,
      mapKey
    } = this.state;
    const employeeLatitude = othersCoordinates[employee_id] ? othersCoordinates[employee_id].latitude : undefined;
    const employeeLongitude = othersCoordinates[employee_id] ? othersCoordinates[employee_id].longitude : undefined;
    return (
      <View style={styles.container}>

        <StatusBarPlaceHolder />
        {employeeLatitude && employeeLongitude && destinationLat && destinationLng ?
          <MapView key={mapKey} style={styles.map}
            region={{
              latitude: destinationLat,
              longitude: destinationLng,
              latitudeDelta: 0.00922,
              longitudeDelta: 0.00121,
            }}
            zoomEnabled={false}
            minZoomLevel={1}
            maxZoomLevel={20}>
            {Platform.OS === 'ios' && (
              <View style={styles.header}>
                <View style={{ flex: 1, flexDirection: 'row', margin: 5 }}>
                  <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center', }}
                    onPress={() => this.props.navigation.goBack()}>
                    <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                      source={require('../icons/back_arrow_double.png')} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <MapView.Marker
              coordinate={{
                latitude: sourceLat,
                longitude: sourceLng,
              }}
              title={userDetails.username}
              description="Vous">
              <Image style={{ width: 35, height: 35, backgroundColor: 'transparent' }}
                source={require('../icons/home_marker.png')} />
            </MapView.Marker>

            <MapView.Marker
              coordinate={{
                latitude: destinationLat,
                longitude: destinationLng,
              }}
              title="Fournisseur"
              description={providerName}>

              <Image style={{ width: 35, height: 35, backgroundColor: 'transparent' }}
                source={require('../icons/car_marker.png')} />
            </MapView.Marker>
            <MapView.Polyline
              coordinates={coords}
              strokeColor="#000" // fallback for when `strokeColors` is not supported by the map-provider
              strokeColors={[
                '#7F0000',
                '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
                '#B24112',
                '#E5845C',
                '#238C23',
                '#7F0000'
              ]}
              strokeWidth={6} />
          </MapView> 
          :
          <ActivityIndicator
            size={30}
            color={'#000'}
          />}
        {jobRequests && jobRequests[currRequestPos] ?
          <SlidingPanel
            headerLayoutHeight={140}
            headerLayout={() =>
              <LinearGradient style={styles.headerLayoutStyle}
                colors={['#d7a10f', '#f2c240', '#f8e1a0']}>
                <View style={{ flex: 1, flexDirection: 'column', width: screenWidth }}>

                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center', marginTop: 5 }}>
                    <Image style={{ width: 20, height: 20, }}
                      source={require('../icons/up_arrow.gif')}>
                    </Image>
                  </View>

                  <View style={{ flexDirection: 'row', flex: 1 }}>

                    <Image style={{ height: 55, width: 55, justifyContent: 'center', alignSelf: 'center', alignContent: 'flex-start', marginLeft: 10, borderRadius: 200, }}
                      source={{ uri: jobRequests[currRequestPos].image }} />
                    <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                      <Text style={{ marginRight: 200, color: 'white', fontSize: 18, marginLeft: 10, fontWeight: 'bold', textAlignVertical: 'center', }}
                        numberOfLines={1}>
                        {jobRequests[currRequestPos].name + " " + jobRequests[currRequestPos].surName}
                      </Text>
                      <Text style={{ color: 'white', fontSize: 14, marginLeft: 10, textAlignVertical: 'center' }}>
                        {jobRequests[currRequestPos].service_name}
                      </Text>
                      <Text style={{ color: 'green', fontSize: 14, marginLeft: 10, textAlignVertical: 'center', fontWeight: 'bold' }}>
                        {jobRequests[currRequestPos].status == "Pending" ? "Demande de chat acceptée" : "Travail accepté"}
                      </Text>
                    </View>

                    <View style={styles.callView}>
                      <TouchableOpacity style={{
                        width: 40, height: 40, backgroundColor: 'black', borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.75, shadowRadius: 5, elevation: 5, padding: 10, marginRight: 15
                      }}
                        onPress={this.callPhoneTask}>
                        <Image style={styles.call}
                          source={require('../icons/call.png')} />
                      </TouchableOpacity>

                      <TouchableOpacity style={{
                        width: 40, height: 40, backgroundColor: 'black', borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.75, shadowRadius: 5, elevation: 5, padding: 10
                      }}
                        onPress={() => this.props.navigation.navigate("Chat", {
                          "providerId": jobRequests[currRequestPos].employee_id,
                          "providerName": jobRequests[currRequestPos].name,
                          "providerSurname": jobRequests[currRequestPos].surName,
                          "providerImage": jobRequests[currRequestPos].image,
                          "serviceName": jobRequests[currRequestPos].service_name,
                          "orderId": jobRequests[currRequestPos].order_id,
                          "fcmId": jobRequests[currRequestPos].fcm_id,
                          'titlePage': "MapDirection"
                        })}>
                        <Image style={styles.call}
                          source={require('../icons/chat.png')} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            }
            slidingPanelLayout={() =>
              <View style={styles.slidingPanelLayoutStyle}>
                <View style={styles.containerSlide}>

                  {this.state.isJobAccepted &&
                    <TouchableOpacity style={styles.buttonContainer}
                      onPress={this.openCompleteConfirmation}>
                      <Text style={styles.text}>
                        Completed
                                    </Text>
                    </TouchableOpacity>}

                  <TouchableOpacity style={styles.buttonContainer}
                    onPress={this.openCancelConfirmation}>
                    <Text style={styles.text}>
                      Cancel Request
                                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            }>
          </SlidingPanel> :
          <ActivityIndicator
            color={'black'}
          />
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width: screenWidth,
    height: screenHeight,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    marginBottom: 140,
    marginTop: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
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
  loaderStyle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerLayoutStyle: {
    width: screenWidth,
    height: 140,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerSlide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: colorBg,
  },
  slidingPanelLayoutStyle: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: colorYellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flex: 1,
    //width: 200,
    paddingTop: 10,
    backgroundColor: '#000000',
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    borderColor: colorYellow,
    borderWidth: 2,
    marginBottom: 25,
    textAlign: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    justifyContent: 'center',
  },
  callView: {
    flex: 1,
    flexDirection: 'row',
    height: 115,
    color: 'white',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    end: 0,
    paddingRight: 15,
  },
  call: {
    width: 20,
    height: 20,
  },
});

const mapStateToProps = state => {
  return {
    notificationsInfo: state.notificationsInfo,
    jobsInfo: state.jobsInfo,
    generalInfo: state.generalInfo,
    userInfo: state.userInfo
  }
}

const mapDispatchToProps = dispatch => {
  return {
    fetchNotifications: data => {
      dispatch(startFetchingNotification(data));
    },
    fetchedNotifications: data => {
      dispatch(notificationsFetched(data));
    },
    fetchingNotificationsError: error => {
      dispatch(notificationError(error));
    },
    fetchingPendingJobInfo: () => {
      dispatch(startFetchingJobCustomer());
    },
    fetchedPendingJobInfo: info => {
      dispatch(fetchedJobCustomerInfo(info));
    },
    fetchingPendingJobInfoError: error => {
      dispatch(fetchCustomerJobInfoError(error))
    },
    dispatchSelectedJobRequest: job => {
      dispatch(setSelectedJobRequest(job));
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MapDirectionScreen);