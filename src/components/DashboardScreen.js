
import React, { Component } from 'react';
import {
    Text, StyleSheet, View, Image,
    TouchableOpacity, StatusBar, Dimensions,
    Animated, BackHandler, FlatList, Modal, Platform,
} from 'react-native';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import RNExitApp from 'react-native-exit-app';
import Config from './Config';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-simple-toast';
import WaitingDialog from './WaitingDialog';
import Hamburger from './Hamburger';
import { startFetchingJobCustomer, fetchedJobCustomerInfo, fetchCustomerJobInfoError, setSelectedJobRequest, updateActiveRequest } from '../Redux/Actions/jobsActions';
import { colorPrimary, colorPrimaryDark, colorBg } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;
const SERVICES_URL = Config.baseURL + 'service/getall'

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

class DashboardScreen extends Component {
    constructor(props) {
        super();
        this.state = {
            dataSource: [],
            isLoading: true,
            backClickCount: 0,
            isToastShow: false,
            availabilityChecked: false,
            availabilityObj: {}
        }
        this.springValue = new Animated.Value(100);
    }

    buttonType = buttonType1 => {
        this.setState({ buttonType: buttonType1 });
    }

    //Get All Services
    componentDidMount() {
        this.onRefresh();
        const { navigation } = this.props;
        navigation.addListener('willFocus', () => {
            //this.onRefresh();
            BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
        });
    }

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

    handleBackButton = () => {
        if (Platform.OS == 'ios')
            this.state.backClickCount == 1 ? RNExitApp.exitApp() : this._spring();
        else
            this.state.backClickCount == 1 ? BackHandler.exitApp() : this._spring();
        return true
    };

    //GridView Items
    renderItem = ({item, index}) => {
        if (item)
            return (
                <TouchableOpacity
                    key={index}
                    style={{
                        flex: 1, flexDirection: 'column', margin: 5, padding: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.75,
                        shadowRadius: 5,
                        elevation: 5,
                        backgroundColor: 'white',
                        borderRadius: 2,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onPress={() => {
                        this.props.navigation.navigate("ListOfProviders", {
                            'serviceName': item.service_name,
                            'serviceId': item.id
                        });
                    }}>
                    <Image style={{ width: 30, height: 30, margin: 10, zIndex: 1000 }}
                        source={{ uri: item.image }} />
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginLeft: 5, alignItems: 'center' }}>
                        <Text style={{ fontWeight: 'bold', color: 'black', fontSize: 12, marginTop: 5, alignSelf: 'center' }}>
                            {item.service_name}
                        </Text>
                    </View>
                </TouchableOpacity>
            )
    }

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

    renderSeparator = () => {
        return (
            <View
                style={{ height: 1, width: '100%', backgroundColor: 'black' }}>
            </View>
        );
    }

    onRefresh = () => {
        fetch(SERVICES_URL).
            then((response) => response.json()).
            then(responseJson => {
                this.setState({
                    dataSource: responseJson.data,  //data is key
                    isLoading: false
                })
            }).
            catch(error => {
                console.log(error);
                this.setState({
                    isLoading: false
                })
                this.showToast("Une erreur s'est produite, vérifiez votre connexion Internet");
            });
        return true;
    }

    goToNextPage = (chat_status, jobInfo) => {
        const { dispatchSelectedJobRequest } = this.props;
        if (chat_status == '0') {
            this.showToast("Votre demande de chat n'est pas acceptée. S'il vous plaît, attendez...")
        }
        else {
            const { userType, status, fcm_id, image, order_id, service_name, name, employee_id, currentPos } = jobInfo;
            const nameArr = name.split(' ');
            const username = nameArr[0];
            const surname = nameArr.pop();
            dispatchSelectedJobRequest(jobInfo);
            if (jobInfo.status == 'Pending') {
                console.log("------------ client go to chat screen : from pending task -------------");
                console.log(this.props);
                this.props.navigation.navigate("Chat",
                    {
                        "providerId": employee_id,
                        "fcmId": fcm_id,
                        "providerName": username,
                        "providerSurname": surname,
                        "providerImage": image,
                        "serviceName": service_name,
                        "orderId": order_id,
                        "titlePage": "Dashboard",
                        "isJobAccepted": status === "Accepted",
                    });
            }
            else if (jobInfo.status == 'Accepted') {
                console.log("------------ client go to chat screen : from accepted task -------------");
                console.log(this.props);
                this.props.navigation.navigate("MapDirection", {
                    currentPos: jobInfo.currentPos,
                    titlePage: "Dashboard"
                });
            }
        }
    }

    showToast = message => {
        Toast.show(message);
    }

    changeWaitingDialogVisibility = bool => {
        this.setState({
            isLoading: bool
        })
    }

    renderPendingJobRequests = (item, index) => {
        if (item) {
            const { image, name, employee_id, order_id, surName, service_name, fcm_id, chat_status, status } = item;
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.pendingJobRow}
                    onPress={() => this.goToNextPage(chat_status, { userType: 'client', status, fcm_id, order_id, image, service_name, name, employee_id, currentPos: index })}>
                    <LinearGradient
                        style={styles.pendingJobRow}
                        colors={['#d7a10f', '#f2c240', '#f8e1a0']}>
                        <Image style={{ height: 55, width: 55, justifyContent: 'center', alignSelf: 'center', alignContent: 'center', marginLeft: 10, borderRadius: 200, }}
                            source={{ uri: image }} />
                        <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                            <Text style={{ color: 'white', fontSize: 18, marginLeft: 10, fontWeight: 'bold', textAlignVertical: 'center' }}>
                                {name + " " + surName}
                            </Text>
                            <Text style={{ color: 'white', fontSize: 14, marginLeft: 10, textAlignVertical: 'center' }}>
                                {service_name}
                            </Text>
                            <Text style={{ color: 'green', fontSize: 14, marginLeft: 10, textAlignVertical: 'center', fontWeight: 'bold' }}>
                                {chat_status == "0" ? "Nouvelle demande d'emploi"
                                    : status == "Pending" ? "Demande de chat acceptée"
                                        : "Travail accepté"}
                            </Text>
                        </View>
                        <View style={styles.arrowView}>
                            <Image style={styles.arrow}
                                source={require('../icons/arrow_right_animated.gif')} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            )
        }
    }

    render() {
        const { jobsInfo: { jobRequests, requestsFetched } } = this.props;
        return (
            <View style={styles.container}>
                {/* <StatusBar barStyle='light-content' backgroundColor='#C5940E' />   */}
                <StatusBarPlaceHolder />
                <View style={styles.header}>
                    <Hamburger
                        navigation={this.props.navigation}
                        text='Harfa'
                    />
                    <TouchableOpacity style={{ width: '100%', justifyContent: 'center', alignContent: 'center' }}
                        onPress={() => this.props.navigation.navigate("AddAddress")}>
                        <Image style={{ width: 22, height: 22, alignSelf: 'center', marginLeft: 45 }}
                            source={require('../icons/maps_location.png')} />
                    </TouchableOpacity>
                </View>

                <View style={{ width: screenWidth, height: 1, backgroundColor: '#C5940E' }}></View>

                <View style={{
                    flexDirection: 'row', width: '100%', height: 45, backgroundColor: colorPrimary,
                    paddingLeft: 20, paddingRight: 20, paddingTop: 5, paddingBottom: 5, shadowColor: '#000',
                    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 5, elevation: 5,
                }}>
                    <View style={{
                        flex: 1, alignItems: "center", justifyContent: 'center'
                    }}>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', }}>
                            Prestations de service
                        </Text>
                    </View>
                </View>

                <View style={[styles.gridView, { marginBottom: jobRequests.length === 0 ? 0 : 75 }]}>
                    <FlatList
                        keyboardShouldPersistTaps={'handled'}
                        numColumns={3}
                        data={this.state.dataSource}
                        renderItem={this.renderItem}
                        keyExtractor={(item, index) => index}
                        showsVerticalScrollIndicator={false}
                        onRefresh={this.onRefresh}
                        refreshing={this.state.isLoading}
                    // ItemSeparatorComponent={this.renderSeparator}
                    />
                </View>
                {/** show pending requests */}
                {requestsFetched && jobRequests.length > 0 ?
                    <View style={styles.pendingJobsContainer}>
                        {jobRequests.map(this.renderPendingJobRequests)}
                    </View> : null}

                <Animated.View style={[styles.animatedView, { transform: [{ translateY: this.springValue }] }]}>
                    <Text style={styles.exitTitleText}>Appuyez à nouveau pour quitter l'application</Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => BackHandler.exitApp()}>
                        <Text style={styles.exitText}>Sortie</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
            </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        jobsInfo: state.jobsInfo,
        generalInfo: state.generalInfo
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
        },
        updateActiveRequest: val => {
            dispatch(updateActiveRequest(val));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(DashboardScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg,
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
    touchableHighlight: {
        width: 50,
        height: 50,
        borderRadius: 50,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 15,
    },
    textHeader: {
        height: 50,
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
        textAlignVertical: 'center',
    },
    text: {
        fontSize: 26,
        color: 'purple',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textView: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
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
        zIndex: 10000,
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
        height: 75,
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
        height: 75,
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
});