import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    View, StyleSheet, Dimensions, Image, Text, TouchableOpacity, BackHandler,
    Linking, PermissionsAndroid, Alert, StatusBar, Platform, Modal, ToastAndroid,
    ActivityIndicator
} from 'react-native';
import { cloneDeep } from 'lodash';
import MapView from 'react-native-maps';
import Polyline from '@mapbox/polyline';
import database from '@react-native-firebase/database';
import Geolocation from 'react-native-geolocation-service';
import LinearGradient from 'react-native-linear-gradient';
import SlidingPanel from 'react-native-sliding-up-down-panels';
import simpleToast from 'react-native-simple-toast';
import Config from './Config';
import WaitingDialog from './WaitingDialog';
import { MAPS_API_KEY } from 'react-native-dotenv';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingJobProvider, fetchedJobProviderInfo, fetchProviderJobInfoError, setSelectedJobRequest } from '../Redux/Actions/jobsActions';
import { colorYellow, colorPrimaryDark, colorBg } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";
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
            </View> :
            <StatusBar barStyle='light-content' backgroundColor={colorPrimaryDark} />
    );
}

class ProMapDirectionScreen extends Component {

    constructor(props) {
        super();
        const { generalInfo: { usersCoordinates, othersCoordinates }, jobsInfo: { jobRequestsProviders, selectedJobRequest: { user_id, lat, lang } }, navigation } = props;
        let currentPos = navigation.getParam('currentPos', 0);
        const currentRequest = jobRequestsProviders[currentPos] || {};
        const destLat = lat === undefined ? othersCoordinates[user_id].latitude : lat;
        const destLong = lang === undefined ? othersCoordinates[user_id].longitude : lang;
        console.log("--------- pro map direction screen ----------");
        console.log(currentRequest);
        this.state = {
            sourcesourceLocation: usersCoordinates.latitude + "," + usersCoordinates.longitude,
            sourceLat: parseFloat(usersCoordinates.latitude),
            sourceLng: parseFloat(usersCoordinates.longitude),
            destinationLocation: destLat + ',' + destLong,
            destinationLat: parseFloat(destLat),
            destinationLng: parseFloat(destLong),
            routeCoordinates: [],
            isLoading: destLat === undefined,
            pageTitle: navigation.state.params.pageTitle,
            currentPos,
            //From ProAcceptRejectJobScreen & ProDashboardScreen
            userId: currentRequest.user_id,
            userName: currentRequest.name,
            userImage: currentRequest.image,
            userMobile: currentRequest.mobile,
            userDob: currentRequest.dob,
            userAddress: currentRequest.address,
            userLat: currentRequest.lat,
            userLang: currentRequest.lang,
            userFcmId: currentRequest.fcm_id,
            orderId: currentRequest.order_id,
            serviceName: currentRequest.service_name,
            mainId: currentRequest.mainId || currentRequest.id,
            delivertAddress: currentRequest.delivery_address,
            deliveryLat: currentRequest.delivery_lat,
            deliveryLang: currentRequest.delivery_lang,
            chatStatus: currentRequest.chat_status,
            status: currentRequest.status,
            proImageAvailable: currentRequest.imageAvailable,
            isJobAccepted: currentRequest.status === 'Accepted',
        };
    };

    componentDidMount() {
        const { navigation } = this.props;
        this.onRefresh();
        navigation.addListener('willFocus', async () => {
            this.onRefresh();
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    componentDidUpdate() {
        const { generalInfo: { usersCoordinates: { latitude, longitude } } } = this.props;
        const { sourceLat, sourceLng } = this.state;
        if (Math.floor(parseInt(latitude)) !== Math.floor(parseInt(sourceLat)) || Math.floor(parseInt(longitude)) !== Math.floor(parseInt(sourceLng)))
            this.onRefresh();
    }

    onRefresh = async () => {
        const { generalInfo: { usersCoordinates, othersCoordinates }, jobsInfo: { selectedJobRequest: { user_id, lat, lang } } } = this.props;
        const destLat = lat === undefined ? othersCoordinates[user_id].latitude : lat;
        const destLong = lang === undefined ? othersCoordinates[user_id].longitude : lang;
        //Get latitude & longitude on Location change
        if (Platform.OS == 'ios') {
            let locationData = {
                latitude: usersCoordinates.latitude,
                longitude: usersCoordinates.longitude,
            }

            let updates = {};
            updates['tracking/' + this.state.orderId] = locationData;
            database().ref().update(updates);

            this.setState({
                sourcesourceLocation: usersCoordinates.latitude + "," + usersCoordinates.longitude,
                sourceLat: parseFloat(usersCoordinates.latitude),
                sourceLng: parseFloat(usersCoordinates.longitude),
                destinationLocation: destLat + ',' + destLong,
                destinationLat: parseFloat(destLat),
                destinationLng: parseFloat(destLong)
            })

            this.getDirections(usersCoordinates.latitude + "," + usersCoordinates.longitude, this.state.destinationLocation);

        }
        else {
            const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

            if (granted) {

                let locationData = {
                    latitude: usersCoordinates.latitude,
                    longitude: usersCoordinates.longitude,
                }

                let updates = {};
                updates['tracking/' + this.state.orderId] = locationData;
                database().ref().update(updates);

                this.setState({
                    sourcesourceLocation: usersCoordinates.latitude + "," + usersCoordinates.longitude,
                    sourceLat: parseFloat(usersCoordinates.latitude),
                    sourceLng: parseFloat(usersCoordinates.longitude),
                })

                this.getDirections(usersCoordinates.latitude + "," + usersCoordinates.longitude, this.state.destinationLocation);
            }
            else {
                console.log("ELSE");
                this.permissionRequest()
            }
        }
    }

    permissionRequest = async () => {
        try {
            if (Platform.OS == 'ios') Geolocation.requestAuthorization();
            else {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    this.onRefresh();
                }
                else {
                    console.log("location permission denied");
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    handleBackButtonClick = () => {
        console.log('pressed', this.state.pageTitle)
        if (this.state.pageTitle == "ProDashboard")
            this.props.navigation.navigate("ProDashboard");
        else if (this.state.pageTitle == "ProAcceptRejectJob")
            this.props.navigation.navigate("ProAcceptRejectJob");
        else 
            this.props.navigation.goBack();
        return true
    }

    callPhoneTask = () => {
        Linking.openURL('tel:' + this.state.userMobile)
    }

    getDirections = async (startLoc, destinationLoc) => {
        if (startLoc && destinationLoc) {
            try {
                fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}&key=${MAPS_API_KEY}`).
                    then(resp => resp.json()).
                    then(respJson => {
                        if (respJson && respJson.routes[0]) {
                            let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
                            let routeCoordinates = points.map((point, index) => {
                                return {
                                    latitude: point[0],
                                    longitude: point[1]
                                }
                            });
                            //If Delay some second, works fine..Reason don't know
                            setTimeout(() => {
                                this.setState({
                                    routeCoordinates: routeCoordinates,
                                    isLoading: false,
                                })
                                return this.state.routeCoordinates;
                            }, 1500);
                        }
                    });

            }
            catch (error) {
                this.setState({
                    isLoading: false,
                })
                alert(error)
                return error
            }
        } else {
            simpleToast.show('Destination co-ordinates missing, try later', simpleToast.LONG);
        }
    }

    openCompleteConfirmation = () => {
        Alert.alert(
            "COMPLETED",
            "Are you sure to complete request ?",
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                {
                    text: 'OK',
                    onPress: this.jobCompleteTask,
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
                    onPress: this.jobCancelTask,
                },
            ]
        );
    }

    jobCompleteTask = () => {
        this.setState({ isLoading: true });
        const { fetchingPendingJobInfo, fetchedPendingJobInfo, jobsInfo: { jobRequestsProviders }, userInfo: { providerDetails } } = this.props;
        const { navigation } = this.props;
        let currentPos = navigation.getParam('currentPos', 0);
        let newJobRequestsProviders = cloneDeep(jobRequestsProviders);
        console.log("--------- complete job ----------");
        console.log(this.state);
        const data = {
            main_id: this.state.mainId,
            chat_status: '1',
            status: 'Completed',
            'notification': {
                "fcm_id": this.state.userFcmId,
                "title": "Job Completed",
                "body": 'Your job request has been completed by the service provder : ' + providerDetails.providerId,
                "notification_by": "Employee",
                "data": {
                    providerId: providerDetails.providerId,
                    user_Id: newJobRequestsProviders[currentPos].user_Id,
                    image: providerDetails.imageSource,
                    fcmId: providerDetails.fcmId,
                    name: providerDetails.name,
                    surname: providerDetails.surname,
                    mobile: providerDetails.mobile,
                    description: providerDetails.description,
                    address: providerDetails.address,
                    lat: providerDetails.lat,
                    lang: providerDetails.lang,
                    serviceName: this.state.serviceName,
                    orderId: this.state.orderId,
                    mainId: this.state.mainId,
                    chat_status: this.state.chatStatus,
                    status: this.state.status,
                    delivery_address: this.state.delivertAddress,
                    delivery_lat: this.state.deliveryLat,
                    delivery_lang: this.state.deliveryLang,
                },
            }
        }
        fetchingPendingJobInfo();
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
                console.log("---------- complete task -----------");
                console.log(responseJson);
                if (responseJson.result) {
                    this.setState({
                        isLoading: false,
                        isAcceptJob: true,
                    });
                    newJobRequestsProviders.splice(currentPos, 1)
                    fetchedPendingJobInfo(newJobRequestsProviders);
                    this.props.navigation.navigate("ProDashboard");
                }
                else {
                    ToastAndroid.show("Something went wrong", ToastAndroid.show);
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

    jobCancelTask = () => {
        this.setState({ isLoading: true });
        const { fetchingPendingJobInfo, fetchedPendingJobInfo, jobsInfo: { jobRequestsProviders }, userInfo: { providerDetails } } = this.props;
        let newJobRequestsProviders = [...jobRequestsProviders];
        console.log("-------- Cancel job request  --------");
        console.log(this.state);
        const data = {
            main_id: this.state.mainId,
            chat_status: '1',
            status: 'Canceled',
            'notification': {
                "fcm_id": this.state.userFcmId,
                "title": "Job Canceled",
                "type": "JobCancellation",
                "notification_by": "Employee",
                "body": 'Your job request has been canceled by the service provder : ' + providerDetails.providerId,
                "data": {
                    user_id: newJobRequestsProviders[this.state.currentPos].user_Id,
                    providerId: providerDetails.providerId,
                    image: providerDetails.imageSource,
                    fcmId: providerDetails.fcmId,
                    name: providerDetails.name,
                    surname: providerDetails.surname,
                    mobile: providerDetails.mobile,
                    description: providerDetails.description,
                    address: providerDetails.address,
                    lat: providerDetails.lat,
                    lang: providerDetails.lang,
                    serviceName: this.state.serviceName,
                    orderId: this.state.orderId,
                    mainId: this.state.mainId,
                    chat_status: this.state.chatStatus,
                    status: 'Canceled',
                    delivery_address: this.state.delivertAddress,
                    delivery_lat: this.state.deliveryLat,
                    delivery_lang: this.state.deliveryLang,
                },
            }
        }

        fetchingPendingJobInfo();
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
                console.log("---------- cancel job ----------");
                console.log(responseJson);
                if (responseJson.result) {
                    this.setState({
                        isLoading: false,
                        isAcceptJob: true,
                    })

                    newJobRequestsProviders.splice(this.state.currentPos, 1);
                    fetchedPendingJobInfo(newJobRequestsProviders);
                    this.props.navigation.navigate("ProDashboard");
                }
                else {
                    //ToastAndroid.show("Something went wrong", ToastAndroid.show);
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

    changeWaitingDialogVisibility = bool => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        const {
            sourceLat,
            sourceLng,
            destinationLat,
            destinationLng,
            routeCoordinates,
            userName,
            proImageAvailable,
            userImage,
            serviceName,
            status
        } = this.state;
        return (
            <View style={styles.container}>
                <StatusBarPlaceHolder />
                {sourceLat && sourceLng && destinationLat && destinationLng ?
                    <MapView style={styles.map}
                        region={{
                            latitude: sourceLat,
                            longitude: sourceLng,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0121,
                        }}
                        minZoomLevel={16}
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
                            title="You"
                            description={""}>
                            <Image style={{ width: 35, height: 35, backgroundColor: 'transparent' }}
                                source={require('../icons/car_marker.png')} />
                        </MapView.Marker>
                        <MapView.Marker
                            coordinate={{
                                latitude: destinationLat,
                                longitude: destinationLng,
                            }}
                            title="Destination"
                            description={userName}>
                            <Image style={{ width: 35, height: 35, backgroundColor: 'transparent' }}
                                source={require('../icons/home_marker.png')} />
                        </MapView.Marker>
                        <MapView.Polyline
                            coordinates={routeCoordinates}
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
                    </MapView> :
                    <ActivityIndicator
                        size={30}
                        color={'#000'}
                    />}

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
                                        source={{ uri: userImage }} />
                                    <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                        <Text style={{ marginRight: 200, color: 'white', fontSize: 18, marginLeft: 10, fontWeight: 'bold', textAlignVertical: 'center', }}
                                            numberOfLines={1}>
                                            {userName}
                                        </Text>
                                        <Text style={{ color: 'white', fontSize: 14, marginLeft: 10, textAlignVertical: 'center' }}>
                                            {serviceName}
                                        </Text>
                                        <Text style={{ color: 'green', fontSize: 14, marginLeft: 10, textAlignVertical: 'center', fontWeight: 'bold' }}>
                                            {status == "Pending" ? "Chat Request Accepted" : "Job Accepted"}
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
                                            onPress={() => this.props.navigation.navigate("ProChat", {
                                                "pageTitle": "ProMapDirection",
                                                currentPos: this.state.currentPos
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
                                {this.state.isJobAccepted && <TouchableOpacity style={styles.buttonContainer}
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
                </SlidingPanel>
                <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
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
    footerView: {
        alignContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderRadius: 10
    },
    footer: {
        width: screenWidth / 1.5,
        flexDirection: 'column',
        backgroundColor: '#191970',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        padding: 15,
        borderRadius: 2,
        position: 'absolute', //Footer
        bottom: 0, //Footer
        marginBottom: 10,
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
            dispatch(startFetchingJobProvider());
        },
        fetchedPendingJobInfo: info => {
            dispatch(fetchedJobProviderInfo(info));
        },
        fetchingPendingJobInfoError: error => {
            dispatch(fetchProviderJobInfoError(error))
        },
        dispatchSelectedJobRequest: job => {
            dispatch(setSelectedJobRequest(job));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProMapDirectionScreen);