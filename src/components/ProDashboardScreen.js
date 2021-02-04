
import React, { Component } from 'react';
import {
    Text, StyleSheet, View, Image, Dimensions, TouchableOpacity,
    ScrollView, Modal, Animated, BackHandler, RefreshControl, StatusBar, Platform
} from 'react-native';
import WaitingDialog from './WaitingDialog';
import RNExitApp from 'react-native-exit-app';
import database from '@react-native-firebase/database';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import ReviewDialog from './ReviewDialog';
import Config from './Config';
import Notifications from './Notifications';
import ProHamburger from './ProHamburger';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { imageExists } from '../misc/helpers';
import {
    startFetchingJobProvider,
    fetchAllJobRequestsProError,
    fetchedAllJobRequestsPro,
    fetchedJobProviderInfo,
    fetchProviderJobInfoError,
    setSelectedJobRequest,
    getAllWorkRequestPro
} from '../Redux/Actions/jobsActions';
import { colorPrimary, colorBg, colorYellow, colorPrimaryDark, colorGray } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const PRO_INFO_UPDATE = Config.baseURL + "employee/";
const REVIEW_RATING = Config.baseURL + 'jobrequest/ratingreview';
const RECENT_USER = Config.baseURL + 'jobrequest/usergroupby/';
const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";
const ASK_FOR_REVIEW = Config.baseURL + "notification/addreviewrequest";

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

class ProDashboardScreen extends Component {
    constructor(props) {
        super();
        const { jobsInfo: { dataWorkSource }, generalInfo: { online, connectivityAvailable }, userInfo: { providerDetails } } = props;
        this.state = {
            isLoading: true,
            isErrorToast: false,
            mainId: '',
            reviewData: '',
            width: Dimensions.get('window').width,
            status: online && providerDetails.status === "1" && connectivityAvailable ? "ONLINE" : "OFFLINE",
            availBackground: online && providerDetails.status === "1" && connectivityAvailable ? 'green' : 'red',
            dataSource: [],
            dataUserSource: [],
            dataWorkSource: dataWorkSource || [],
            isDialogLogoutVisible: false,
            isRecentMessage: false,
            isWorkRequest: false,
            isRecentUser: false,
            isReviewDialogVisible: false,
            rating: '3',
            review: '',
            refreshing: false,
            pause: false,
            backClickCount: 0,
            proImageAvailable: null,
        }
        this.springValue = new Animated.Value(100);
    }

    //Get All Bookings
    componentDidMount = () => {
        this.initiateProps();
        const { navigation } = this.props;
        this.onRefresh();
        navigation.addListener('willFocus', () => {
            this.onRefresh();
            this.initiateProps();
            BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    initiateProps = () => {
        const { jobsInfo: { dataWorkSource } } = this.props;
        this.setState({ dataWorkSource, isLoading: false, isWorkRequest: true });
    }

    componentDidUpdate() {
        const { jobsInfo: { dataWorkSource }, fetchJobRequestHistory, generalInfo: { connectivityAvailable }, userInfo: { providerDetails } } = this.props;
        const { status } = this.state;
        if (!dataWorkSource.length)
            fetchJobRequestHistory(providerDetails.providerId);
        if (!connectivityAvailable && status === "ONLINE")
            this.setState({
                status: "OFFLINE",
                availBackground: "red",
            });
        else if (connectivityAvailable && providerDetails.status === "1" && status === "OFFLINE") {
            this.setState({
                status: "ONLINE",
                availBackground: "green",
            });
        }
    }

    //Recent Chat Message
    getAllRecentChat = () => {
        const { userInfo: { providerDetails } } = this.props;
        let dbRef = database().ref('recentMessage').child(providerDetails.providerId);
        dbRef.once('value', (snapshot) => {
            const key = snapshot.key;
            const message = snapshot.val();

            this.setState({
                isLoading: true,
            });

            if (message != null) {
                dbRef.on('child_added', val => {
                    const { dataSource } = this.state;

                    let message = val.val();
                    let present = false;
                    dataSource.map(obj => {
                        if (JSON.stringify(obj) === JSON.stringify(message))
                            present = true;
                    })
                    if (!present) {
                        this.setState(prevState => ({ dataSource: [...prevState.dataSource, message], isLoading: false, isRecentMessage: true }));
                    }

                })
            }
            else {
                this.setState({
                    isLoading: false,
                    isRecentMessage: false,
                })
            }
        })
    }

    getAllRecentUser = () => {
        this.setState({
            isLoading: true
        });
        const { userInfo: { providerDetails } } = this.props;
        fetch(RECENT_USER + providerDetails.providerId)
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.result) {
                    this.setState({
                        dataUserSource: responseJson.data,
                        isLoading: false,
                        isRecentUser: true,
                    })
                }
                else {
                    this.setState({
                        isLoading: false,
                        isRecentUser: false,
                    })
                }
            })
            .catch((error) => {
                console.log(error);
                this.setState({
                    isLoading: false,
                    isRecentUser: true,
                    isErrorToast: true
                });
                this.showToast("Something went wrong, Check your internet connection");
            });
    }

    renderRecentMessageItem = (item, index) => {
        if (item) {
            const { dispatchSelectedJobRequest } = this.props;
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.itemMainContainer}
                    onPress={() => {
                        dispatchSelectedJobRequest({ user_id: item.id });
                        setTimeout(() => {
                            this.props.navigation.navigate("ProChat", {
                                currentPos: index,
                                'userId': item.id,
                                'name': item.name,
                                'image': item.image,
                                'orderId': item.orderId,
                                'serviceName': item.serviceName,
                                'pageTitle': "ProDashboard",
                                'imageAvailable': item.imageAvailable
                            })
                        }, 100);
                    }}>
                    <View style={styles.itemImageView}>
                        <Image style={{ width: 40, height: 40, borderRadius: 100 }}
                            source={{ uri: item.image }} />
                    </View>
                    <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14, color: 'black', textAlignVertical: 'center' }}>
                            {item.name}
                        </Text>
                        <Text style={{
                            width: screenWidth - 150, fontSize: 10, color: 'black',
                            textAlignVertical: 'center', color: 'gray', marginTop: 3,
                        }}
                            numberOfLines={2}>
                            {item.textMessage}
                        </Text>
                    </View>

                    <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
                        <Text style={{ alignSelf: 'flex-end', marginRight: 20, fontSize: 8 }}>
                            {item.date}
                        </Text>
                    </View>
                </TouchableOpacity>
            )
        }
    }

    renderWorkItem = (item, index) => {
        console.log("-------- render work item -----------");
        console.log(item);
        const { userInfo: { providerDetails } } = this.props;
        if (item && String(item.employee_id) === String(providerDetails.providerId) && (item.status === 'Accepted' || item.status === 'Completed' || item.status === 'Canceled')) {
            return (
                <TouchableOpacity key={index} style={{ width: screenWidth, flexDirection: 'row', backgroundColor: 'white' }}
                    onPress={() => this.props.navigation.navigate("ProBookingDetails", {
                        currentPos: index,
                        "bookingDetails": item
                    })}>
                    <View style={{ flex: 1, alignItems: 'center', paddingTop: 15, paddingBottom: 15, paddingLeft: 5, paddingRight: 5 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{item.service_details.service_name}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', paddingTop: 15, paddingBottom: 15, paddingLeft: 5, paddingRight: 5 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', ...item.status == 'Pending' ? styles.colorYellow : item.status == 'Accepted' ? styles.colorGreen : item.status == 'Completed' ? styles.colorBlack : styles.colorRed }}>{item.status}</Text>
                    </View>
                    <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingTop: 15, paddingBottom: 15, paddingLeft: 5, paddingRight: 5 }}
                        onPress={() => this.askForReview(item)}>
                        <Text style={{ fontSize: 12, }}>{item.customer_review == "Requested" ? 'Waiting' : item.customer_rating == "" ? 'Ask for review' : item.customer_rating + "/5"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, alignItems: 'center', paddingTop: 15, paddingBottom: 15, paddingLeft: 5, paddingRight: 5, }}
                        onPress={() => this.changeDialogVisibility(true, "", item, "", "")}>
                        <Text style={{ fontSize: 12, }}>{item.employee_rating == "" ? 'Give review' : item.employee_rating + "/5"}</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            )
        }
    }

    updateAvailabilityInMongoDB = async userData => {
        const { userInfo: { providerDetails } } = this.props;
        await fetch(PRO_INFO_UPDATE + providerDetails.providerId,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            })
            .then((response) => {
                return response.json()
            })
            .then((response) => {
                const { result, data } = response;
                const { generalInfo: { online } } = this.props;
                if (result && data) {
                    providerDetails.status = data.status;
                    this.setState({
                        status: data.status === "1" && online ? "ONLINE" : "OFFLINE",
                        availBackground: data.status === "1" && online ? 'green' : 'red',
                        isLoading: false,
                        isErrorToast: false
                    });
                    this.showToast(response.message);
                }
                else {
                    this.setState({
                        isLoading: false,
                    });
                    this.showToast(response.message);
                }
            })
            .catch((error) => {
                console.log("Error :" + error);
                this.setState({
                    isLoading: false,
                });
            });
    }

    changeAvailabilityStaus = () => {
        const { userInfo: { providerDetails } } = this.props;
        var statusValue = null;
        const providerId = providerDetails.providerId;
        const usersRef = database().ref('users/' + providerId);
        this.setState({
            isLoading: true,
        })

        if (this.state.status == 'ONLINE') {
            statusValue = '0';
        }
        else if (this.state.status == 'OFFLINE') {
            statusValue = '1';
        }

        const userData = {
            "status": statusValue
        }
        usersRef.once('value', data => {
            if (data) {
                usersRef.update(userData).then(() => {
                    this.updateAvailabilityInMongoDB(userData);
                }).catch(e => {
                    console.log(e.message)
                });
            }
            else {
                usersRef.set(userData).then(() => {
                    this.updateAvailabilityInMongoDB(userData);
                }).catch(e => {
                    console.log(e.message);
                });
            }
        })

    };

    _spring = () => {
        this.setState({ backClickCount: 1 }, () => {
            Animated.sequence([
                Animated.spring(
                    this.springValue,
                    {
                        toValue: -.15 * 1,
                        friction: 5,
                        duration: 300,
                        useNativeDriver: true,
                    }
                ),
                Animated.timing(
                    this.springValue,
                    {
                        toValue: 100,
                        duration: 300,
                        useNativeDriver: true,
                    }
                ),

            ]).start(() => {
                this.setState({ backClickCount: 0 });
            });
        });
    }

    handleBackButtonClick = () => {
        if (Platform.OS == 'ios')
            this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
        else
            this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
        return true
    };

    renderSeparator = () => {
        return (
            <View
                style={{ height: 1, width: '100%', backgroundColor: colorBg }}>
            </View>
        );
    };

    //Call also from ReviewDialog
    changeDialogVisibility = (bool, text, item, rating, review) => {

        console.log("------- change dialog visibility ----");
        console.log(item);
        if (item != '') {

            if (item.employee_rating == '') {
                this.setState({
                    isDialogLogoutVisible: bool,
                    reviewData: item,
                    mainId: item._id,
                })
            }
        }
        else {
            if (text == "Not now") {
                this.setState({
                    isDialogLogoutVisible: bool,
                    reviewData: item,
                })
            }
            else if (text == "Submitted") {
                this.reviewTask(rating, review, this.state.reviewData);
                this.setState({
                    isDialogLogoutVisible: bool,
                    reviewData: item,
                    rating: rating,
                    review: review,
                });
            }
        }
    }

    goToProMapDirection = (chat_status, status, jobInfo) => {
        if (chat_status == '0') {
            this.setState({
                isErrorToast: true,
            });
            this.showToast("Accept Chat Request First");
        }
        else {
            const { dispatchSelectedJobRequest } = this.props;
            dispatchSelectedJobRequest(jobInfo);
            if (status == 'Pending') {
                this.props.navigation.navigate("ProAcceptRejectJob", { currentPos: jobInfo.currentPos, orderId: jobInfo.orderId });
            }
            else if (status == 'Accepted') {
                this.props.navigation.navigate("ProMapDirection", {
                    currentPos: jobInfo.currentPos,
                    'pageTitle': "ProDashboard",
                });
            }
        }
    }

    acceptChatRequest = pos => {
        const { fetchedPendingJobInfo, userInfo: { providerDetails }, jobsInfo: { jobRequestsProviders }, dispatchSelectedJobRequest } = this.props;
        var newjobRequestsProviders = [...jobRequestsProviders];
        const {
            id,
            user_id,
            fcm_id,
            name,
            service_name,
            order_id,
            image,
            mobile,
            dob,
            address,
            lat,
            lang,
            chat_status,
            status,
            delivery_address,
            delivery_lat,
            delivery_lang
        } = jobRequestsProviders[pos];

        dispatchSelectedJobRequest(jobRequestsProviders[pos]);

        this.setState({
            isLoading: true,
        });

        const data = {
            main_id: id,
            chat_status: '1',
            status: 'Pending',
            'notification': {
                "fcm_id": fcm_id,
                "title": "Chat Request Accepted",
                "type": "ChatAcceptance",
                "notification_by": "Employee",
                "body": 'Chat request has been accepted by ' + name + ' Request Id : ' + order_id,
                "data": {
                    user_id: user_id,
                    providerId: providerDetails.providerId,
                    serviceName: service_name,
                    orderId: order_id,
                    mainId: id,
                    chat_status: '1',
                    status: 'Pending',
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
            .then(response => response.json())
            .then(responseJson => {
                if (responseJson.result) {
                    this.setState({
                        isLoading: false
                    })
                    var jobData = {
                        id: responseJson.data.id,
                        order_id,
                        user_id,
                        image,
                        fcm_id,
                        name,
                        mobile,
                        dob,
                        address,
                        lat,
                        lang,
                        service_name,
                        chat_status,
                        status,
                        delivery_address,
                        delivery_lat,
                        delivery_lang,
                    }

                    imageExists(image).then(res => {
                        jobData.imageAvailable = res;
                    });

                    newjobRequestsProviders[pos] = jobData;
                    fetchedPendingJobInfo(newjobRequestsProviders);
                    this.props.navigation.navigate("ProAcceptRejectJob");
                }
                else {
                    this.setState({
                        isLoading: false,
                        isErrorToast: true,
                    });

                    this.showToast("Something went wrong")
                }
            })
            .catch(error => {
                console.log("Error >>> " + error);
                this.setState({
                    isLoading: false,
                });
            })
    }

    renderPendingJobs = (item, index) => {
        if (item) {
            const { image, name, user_id, service_name, chat_status, status, order_id } = item;
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.pendingJobRow}
                    onPress={() => this.goToProMapDirection(chat_status, status, { currentPos: index, userType: 'provider', user_id, orderId: order_id })}
                >
                    <LinearGradient style={styles.pendingJobRow}
                        colors={['#d7a10f', '#f2c240', '#f8e1a0']}>
                        <Image style={{ height: 55, width: 55, justifyContent: 'center', alignSelf: 'center', alignContent: 'center', marginLeft: 10, borderRadius: 200, }}
                            source={{ uri: image }} />
                        <View style={{ flexDirection: 'column', justifyContent: 'center', textAlignVertical: 'middle' }}>
                            <Text style={{ color: 'white', fontSize: 18, marginLeft: 10, fontWeight: 'bold' }}>
                                {name}
                            </Text>
                            <Text style={{ color: 'white', fontSize: 14, marginLeft: 10, textAlignVertical: 'center' }}>
                                {"Request for " + service_name}
                            </Text>
                            <Text style={{ color: 'green', fontSize: 14, marginLeft: 10, textAlignVertical: 'center', fontWeight: 'bold' }}>
                                {chat_status == "0" ? "New Job Request" : status == "Pending" ? "Chat Request Accepted" : "Job Accepted"}
                            </Text>
                        </View>
                        {chat_status == '1' &&
                            <View style={styles.arrowView}>
                                <Image style={styles.arrow}
                                    source={require('../icons/arrow_right_animated.gif')} />
                            </View>
                        }
                        {chat_status == '0' &&
                            <TouchableOpacity style={styles.arrowView}
                                onPress={() => this.acceptChatRequest(index)}>
                                <View style={styles.viewAccept}>
                                    <Text style={styles.textAccept}>Accept</Text>
                                </View>
                            </TouchableOpacity>
                        }
                    </LinearGradient>
                </TouchableOpacity>
            )
        }
    }

    reviewTask = (rating, review, item) => {
        console.log("--------- review task ------------");
        console.log(rating);
        console.log(review);
        console.log(item);
        console.log(this.props);
        const { userInfo: { providerDetails } } = this.props;
        this.setState({
            isLoading: true,
        });
        const reviewData = {
            "main_id": this.state.mainId,
            "type": "Employee",
            "user_id": item.user_details._id,
            "employee_id": providerDetails.providerId,
            "order_id": item.order_id,
            "rating": rating,
            "review": review,
            "notification": {
                "fcm_id": item.user_details.fcm_id,
                "type": "Review",
                "notification_by": "Employee",
                "title": "Given Review",
                "body": providerDetails.name + " " + providerDetails.surname + " has given you a review",
            }
        }

        fetch(REVIEW_RATING,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            })
            .then((response) => response.json())
            .then((response) => {
                if (response.result) {
                    this.setState({
                        isLoading: false,
                        isReviewDialogVisible: false,
                        mainId: "",
                        isErrorToast: false
                    })
                    this.showToast("Review submitted");
                    this.onRefresh();
                }
                else {
                    this.setState({
                        isLoading: false,
                    })
                    //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                    this.showToast("Something went wrong");
                }
            })
            .catch((error) => {
                console.log("Error :" + error);
                this.setState({
                    isLoading: false,
                })
            })
            .done()
    }

    askForReview = item => {
        const { fetchJobRequestHistory, userInfo: { providerDetails } } = this.props;
        if (item.customer_review != "Requested" && item.customer_rating == "") {
            this.setState({
                isLoading: true,
            })

            const askReviewData = {
                "order_id": item._id,
                "user_id": item.user_id,
                "employee_id": providerDetails.providerId,
                'notification': {
                    "fcm_id": item.user_details.fcm_id,
                    "type": "ReviewRequest",
                    "notification_by": "Employee",
                    "title": "Ask For Review",
                    "body": providerDetails.name + " " + providerDetails.surname + " waiting for your feedback",
                }
            }

            fetch(ASK_FOR_REVIEW,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(askReviewData)
                })
                .then((response) => response.json())
                .then((response) => {
                    if (response.result) {
                        this.setState({
                            isLoading: false,
                            dataWorkSource: [],
                            isErrorToast: false,
                        });
                        const { userInfo: { providerDetails } } = this.props;
                        //ToastAndroid.show("Request submitted successfully", ToastAndroid.show);
                        this.showToast("Request submitted successfully")
                        fetchJobRequestHistory(providerDetails.providerId);
                    }
                    else {
                        this.setState({
                            isLoading: false,
                            isErrorToast: true
                        })
                        //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                        this.showToast("Something went wrong")
                    }
                })
                .catch((error) => {
                    console.log("Error :" + error);
                    this.setState({
                        isLoading: false,
                        isErrorToast: true
                    })
                    //ToastAndroid.show("Something went wrong", ToastAndroid.show);
                    this.showToast("Something went wrong")
                })
                .done()
        }
        else if (item.customer_review == "Requested") {
            this.setState({
                isErrorToast: true
            })
            // ToastAndroid.show("You have already asked, Please wait for customer feedback", ToastAndroid.show);
            this.showToast("You have already asked, Please wait for customer feedback");
        }
    }

    showToast = message => {
        Toast.show(message);
    }

    onRefresh = () => {
        this.setState({ refreshing: true });
        const { generalInfo: { online, connectivityAvailable }, userInfo: { providerDetails } } = this.props;
        this.setState({
            dataSource: [],
            dataUserSource: [],
            isRecentMessage: false,
            status: online && providerDetails.status === "1" && connectivityAvailable ? "ONLINE" : "OFFLINE",
            isJobRequest: false,
            isRecentUser: false,
        });
        this.getAllRecentChat();
        this.getAllRecentUser();
        this.springValue = new Animated.Value(100);
        this.setState({ refreshing: false });
    }

    changeWaitingDialogVisibility = bool => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        const { jobsInfo: { requestsProvidersFetched, jobRequestsProviders, dataWorkSource } } = this.props;
        return (
            <View style={styles.container}>
                <StatusBarPlaceHolder />
                <View style={styles.header}>
                    <ProHamburger
                        Notifications={Notifications}
                        navigation={this.props.navigation}
                        text='Harfa'
                    />
                    <TouchableOpacity style={{ width: '100%', justifyContent: 'center', alignContent: 'center' }}
                        onPress={() => this.props.navigation.navigate("ProAddAddress")}>
                        <Image style={{ width: 22, height: 22, alignSelf: 'center', marginLeft: 45 }}
                            source={require('../icons/maps_location.png')} />
                    </TouchableOpacity>
                </View>
                <View style={styles.onlineOfflineHeader}>
                    <Text style={{
                        flex: 1, textAlignVertical: 'center', alignItems: 'flex-start',
                        alignContent: 'flex-start', justifyContent: 'flex-start', marginLeft: 15, fontWeight: 'bold'
                    }}>
                        Availability
                    </Text>

                    <TouchableOpacity style={styles.onlineOfflineView}
                        onPress={this.changeAvailabilityStaus}>
                        <View style={[styles.onlineOfflineText, { backgroundColor: this.state.availBackground }]}>
                            <Text style={{ color: 'white', fontWeight: 'bold', alignSelf: 'center' }}>
                                {this.state.status}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={{ marginBottom: jobRequestsProviders.length === 0 ? 0 : 80 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this.onRefresh}
                            title="Loading" />
                    }>
                    <View>
                        {this.state.isRecentMessage &&
                            <View style={styles.mainContainer}>
                                <View style={styles.recentMessageHeader}>
                                    <Text style={{
                                        flex: 1, textAlignVertical: 'center', alignItems: 'flex-start', fontSize: 18,
                                        alignContent: 'flex-start', justifyContent: 'flex-start', marginLeft: 15, fontWeight: 'bold'
                                    }}>
                                        Recent Message
                                    </Text>
                                    {false &&
                                        <TouchableOpacity style={styles.viewAll}
                                            onPress={() => this.props.navigation.navigate("ProAllMessage")}>
                                            <Text style={styles.textViewAll}>View All</Text>
                                        </TouchableOpacity>
                                    }
                                </View>

                                <View style={styles.listView}>
                                    {
                                        this.state.dataSource.map(this.renderRecentMessageItem)
                                    }
                                </View>
                            </View>
                        }
                        {this.state.isWorkRequest &&
                            <View style={styles.mainContainer}>
                                <View style={styles.recentMessageHeader}>
                                    <Text style={{
                                        flex: 1, textAlignVertical: 'center', alignItems: 'flex-start', fontSize: 18,
                                        alignContent: 'flex-start', justifyContent: 'flex-start', marginLeft: 15, fontWeight: 'bold'
                                    }}>
                                        Work
                                    </Text>
                                    {false &&
                                        <TouchableOpacity style={styles.viewAll}>
                                            <Text style={styles.textViewAll}>View All</Text>
                                        </TouchableOpacity>
                                    }
                                </View>
                                <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                                <View style={{ flexDirection: 'row', padding: 10, justifyContent: 'center' }}>
                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Job's Name</Text>
                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Status</Text>
                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Review</Text>
                                    <Text style={{ flex: 1, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Client Review</Text>
                                </View>

                                <View style={styles.listView}>
                                    {dataWorkSource.map(this.renderWorkItem)}
                                </View>
                            </View>
                        }
                        <Modal transparent={true} visible={this.state.isDialogLogoutVisible} animationType='fade'
                            onRequestClose={() => this.changeDialogVisibility(false, "", "", "", "", "")}>
                            <ReviewDialog style={{
                                shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.75, shadowRadius: 5, elevation: 5
                            }}
                                changeDialogVisibility={this.changeDialogVisibility}
                                data={JSON.stringify(this.state.reviewData) + "//////" + "0"} />
                        </Modal>
                    </View>

                    {!this.state.isRecentUser && !this.state.isWorkRequest && !this.state.isLoading &&
                        <View style={{ width: screenWidth, height: screenHeight - 130, justifyContent: 'center' }}>
                            <Image style={{ height: 75, width: 75, justifyContent: 'center', alignSelf: 'center', alignContent: 'center', marginLeft: 10, }}
                                source={require('../icons/no_request.png')} />
                            <Text style={{ fontSize: 18, alignItems: 'center', alignSelf: 'center' }}>
                                No Job Request Found
                            </Text>
                        </View>
                    }
                </ScrollView>
                {requestsProvidersFetched && jobRequestsProviders.length > 0 ?
                    <View style={styles.pendingJobsContainer}>
                        {jobRequestsProviders.map(this.renderPendingJobs)}
                    </View> : null}

                <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
                <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                    <Text style={styles.exitTitleText}>Press back again to exit the app</Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => BackHandler.exitApp()}>
                        <Text style={styles.exitText}>Exit</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }
}

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
        },
        dispatchAllFetchedProJobRequests: jobs => {
            dispatch(fetchedAllJobRequestsPro(jobs));
        },
        fetchAllProJobRequestsError: () => {
            dispatch(fetchAllJobRequestsProError());
        },
        fetchJobRequestHistory: providerId => {
            dispatch(getAllWorkRequestPro(providerId));
        }
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(ProDashboardScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        width: '100%',
        height: 50,
        flexDirection: 'row',
        backgroundColor: colorPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    onlineOfflineHeader: {
        width: screenWidth,
        height: 50,
        flexDirection: 'row',
        backgroundColor: colorBg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        alignItems: 'center'
    },
    onlineOfflineView: {
        flex: 1,
        textAlignVertical: 'center',
        color: 'white',
    },
    onlineOfflineText: {
        width: 90,
        textAlignVertical: 'center',
        textAlign: 'center',
        alignSelf: 'flex-end',
        fontWeight: 'bold',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 8,
        paddingBottom: 8,
        color: 'white',
        borderRadius: 3,
        marginRight: 20,
    },
    mainContainer: {
        flexDirection: 'column',
        backgroundColor: colorBg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        alignItems: 'center',
        marginTop: 10
    },
    noticationsCount: {
        position: 'absolute',
        textAlignVertical: 'center',
        textAlign: 'center',
        borderRadius: 10,
        color: 'white',
        right: 15,
        height: 20,
        width: 20,
        backgroundColor: 'red',
        top: 5
    },
    recentMessageHeader: {
        width: screenWidth,
        height: 50,
        flexDirection: 'row',
        backgroundColor: colorBg,
        alignItems: 'center'
    },
    viewAll: {
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
        backgroundColor: 'white',
        borderColor: colorYellow,
        borderWidth: 2,
        borderRadius: 5,
        marginRight: 20,
    },
    textViewAll: {
        textAlignVertical: 'center',
        textAlign: 'center',
        alignSelf: 'flex-end',
        color: 'black',
    },
    viewAccept: {
        alignSelf: 'flex-end',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
        backgroundColor: 'white',
        borderColor: colorYellow,
        borderWidth: 2,
        borderRadius: 5,
        marginRight: 20,
    },
    textAccept: {
        textAlignVertical: 'center',
        textAlign: 'center',
        alignSelf: 'flex-end',
        fontWeight: 'bold',
        color: '#4c4c4c',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
        textAlignVertical: 'center',
        alignSelf: 'center'
    },
    listView: {
        flex: 1,
        backgroundColor: colorBg,
        padding: 5,
    },
    itemMainContainer: {
        width: screenWidth,
        flex: 1,
        height: 70,
        flexDirection: 'row',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        padding: 5,
    },
    itemImageView: {
        width: 50,
        height: 50,
        borderRadius: 50,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 5,
    },
    colorYellow: {
        color: colorYellow,
    },
    colorRed: {
        color: 'red',
    },
    colorGreen: {
        color: 'green',
    },
    colorBlack: {
        color: 'black',
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
    animatedView: {
        width: screenWidth,
        backgroundColor: colorPrimaryDark,
        elevation: (Platform.OS === 'android') ? 50 : 0,
        position: "absolute",
        bottom: 0,
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        zIndex: 1000,
    },
    exitTitleText: {
        textAlign: "center",
        color: 'white',
        marginRight: 20,
    },
    exitText: {
        color: 'red',
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 3
    },
    pendingJobStyle: {
        flex: 1,
        width: screenWidth,
        height: 80,
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    pendingJobsContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: screenWidth,
        position: 'absolute',
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 10
    },
    pendingJobRow: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        height: 75,
    },
    linearGradient: {
        flex: 1,
        paddingLeft: 15,
        paddingRight: 15,
        borderRadius: 5
    },
    buttonText: {
        fontSize: 18,
        fontFamily: 'Gill Sans',
        textAlign: 'center',
        margin: 10,
        color: '#ffffff',
        backgroundColor: 'transparent',
    },
    arrowView: {
        flex: 1,
        height: 80,
        color: 'white',
        alignContent: 'center',
        justifyContent: 'center',
    },
    arrow: {
        width: 35,
        height: 35,
        alignSelf: 'flex-end',
        marginRight: 30,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: "absolute",
        end: 0,
        left: 0,
        top: 0,
        bottom: 0
    },
    modal: {
        height: 360,
        paddingTop: 10,
        alignSelf: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: colorBg,
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    touchableHighlight: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: 5,
        alignSelf: 'stretch',
        alignItems: 'center',
        borderRadius: 5,
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 5,
        marginLeft: 5,
        marginRight: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
    },
    textView: {
        flex: 1,
        alignItems: 'center',
    },
    buttonView: {
        width: '100%',
        flexDirection: 'row',
    }
});