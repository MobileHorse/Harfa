import React from 'react';
import { connect } from 'react-redux';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, Alert, PermissionsAndroid } from 'react-native';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingMessages, messagesFetched, messagesError } from '../Redux/Actions/messageActions';
import { startFetchingJobCustomer, fetchedJobCustomerInfo, fetchCustomerJobInfoError, setSelectedJobRequest, updateActiveRequest } from '../Redux/Actions/jobsActions';
import {
    updatingCoordinates,
    updateCoordinates,
    updateCoordinatesError,
    updateOthersCoordinates,
    updatingOthersCoordinates,
    updateOthersCoordinatesError,
    updateOnlineStatus,
    updateConnectivityStatus,
    updateLiveChatUsers
} from '../Redux/Actions/generalActions';
import { DrawerActions } from 'react-navigation-drawer';
import { NavigationEvents } from 'react-navigation';
import database from '@react-native-firebase/database';
import Toast from 'react-native-simple-toast';
import OnlineUsers from './OnlineUsers';
import NetInfo from "@react-native-community/netinfo";
import Config from './Config';
import geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-community/async-storage';
import { imageExists } from '../misc/helpers';
import { cloneDeep } from 'lodash';
import { Notifications } from 'react-native-notifications';

const socket = Config.socket;
const Android = Platform.OS === 'android';
const PRO_GET_PROFILE = Config.baseURL + "employee/";

class Hamburger extends React.Component {
    constructor(props) {
        super();
        this.state = {
            employeesLocationsFetched: false,
            connectivityAvailable: false,
            availabilityChecked: false,
            availabilityObj: {}
        }
        Notifications.events().registerRemoteNotificationsRegistered(event => {
            // TODO: Send the token to my server so it could send back push notifications...
        });

        Notifications.events().registerRemoteNotificationsRegistrationFailed(event => {
            console.error(event);
        });

        Notifications.registerRemoteNotifications();
    }
    componentDidMount() {
        const {
            fetchedNotifications,
            fetchedMessages,
            jobsInfo: { allJobRequestsClient },
            updateLiveChatUsers,
            userInfo: { userDetails },
        } = this.props;
        const senderId = userDetails.userId;
        const userRef = database().ref(`liveLocation/${senderId}`);
        this.checkNoficationsAvailability();
        this.checkForUserType();

        messaging().onMessage(message => {
            const { notification, data } = message;
            const { title, body } = notification;
            const { fetchedNotifications, updateActiveRequest, navigation, notificationsInfo, fetchedPendingJobInfo, jobsInfo: { jobRequests } } = this.props;
            const currentGenericCount = notificationsInfo.generic;
            const newGenericCount = currentGenericCount + 1;
            let newJobRequests = cloneDeep(jobRequests);
            fetchedNotifications({ type: 'generic', value: newGenericCount });
            const orderId = data.orderId;
            let pos = 0;

            jobRequests.map((obj, key) => {
                const currOrderId = obj.order_Id;
                if (orderId === currOrderId) pos = key;
            });

            console.log("----------- client onMessage -------------");
            console.log("pos: ", pos);
            console.log(message);
            console.log(this.props);

            if (title == "Message Recieved") {
                /* Android ? Notifications.postLocalNotification({
                    title,
                    body,
                    extra: "data"
                }) :
                    Notifications.postLocalNotification({
                        body,
                        title,
                        sound: "chime.aiff",
                        silent: false,
                        category: "SOME_CATEGORY",
                        userInfo: {}
                    }); */
            }
            else if (title == "Chat Request Rejected") {
                newJobRequests.splice(pos, 1);
                fetchedPendingJobInfo(newJobRequests);
                this.showToast("Le fournisseur de services a rejeté votre demande. Veuillez réessayer plus tard")
            }
            else if (title == "Job Accepted") {
                const employee_id = data.providerId;
                console.log("---------- job accepted on message --------");
                console.log("employee_id: ", employee_id);
                database().ref('chatting').
                    child(senderId).
                    child(employee_id)
                    .once('value', data => {
                        console.log("=============== job accepted chatting value once ==========");
                        console.log(data);
                        if (data) {
                            const { dataChatSource } = this.props.messagesInfo;
                            let newDataChatSource = Object.assign({}, dataChatSource);
                            let newArr = newDataChatSource[employee_id] ? [...newDataChatSource[employee_id]] : [];
                            newArr.push(data.val())
                            const newData = [...newArr];
                            //filter out only unique messages
                            const uniqueData = Array.from(new Set(newData.map(a => {
                                if (a)
                                    return a.time
                            })))
                                .map(time => {
                                    return newData.find(a => {
                                        if (a)
                                            a.time === time
                                    })
                                });
                            newDataChatSource[employee_id] = uniqueData;
                            fetchedMessages(newDataChatSource);
                        }

                    });
                database().ref('chatting').
                    child(senderId).
                    child(employee_id)
                    .on('child_added', data => {
                        console.log("=============== job accepted chatting child_added on ==========");
                        console.log(data);
                        if (data.val()) {
                            const { messagesInfo: { dataChatSource } } = this.props;
                            let newDataChatSource = Object.assign({}, dataChatSource);
                            let newArr = newDataChatSource[employee_id] ? [...newDataChatSource[employee_id]] : [];
                            newArr.push(data.val());
                            const newData = [...newArr];
                            //filter out only unique messages
                            const uniqueData = Array.from(new Set(newData.map(a => {
                                if (a)
                                    return a.time
                            })))
                                .map(time => {
                                    return newData.find(a => {
                                        if (a) return a.time === time
                                    })
                                });
                            newDataChatSource[employee_id] = uniqueData;
                            fetchedMessages(newDataChatSource);
                        }

                    });
                var pendingJobData = {
                    id: data.mainId,
                    order_id: data.orderId,
                    employee_id: data.ProviderId,
                    image: data.image,
                    fcm_id: data.fcmId,
                    name: data.name,
                    surName: data.surname,
                    mobile: data.mobile,
                    description: data.description,
                    address: data.address,
                    lat: data.lat,
                    lang: data.lang,
                    service_name: data.serviceName,
                    chat_status: data.chat_status,
                    status: data.status,
                    delivery_address: data.delivery_address,
                    delivery_lat: data.delivery_lat,
                    delivery_lang: data.delivery_lang,
                }
                newJobRequests[pos] = pendingJobData;
                fetchedPendingJobInfo(newJobRequests);
                this.showToast("Votre travail a été accepté.");
            }
            else if (title == "Job Rejected") {
                newJobRequests.splice(pos, 1);
                fetchedPendingJobInfo(newJobRequests);
                this.showToast("Votre travail a été rejeté. Veuillez réessayer plus tard")
            }
            else if (title == "Job Completed") {
                newJobRequests.splice(pos, 1);
                fetchedPendingJobInfo(newJobRequests);
                this.showToast("Votre travail est terminé.")
            }
            else if (title == "Chat Request Accepted" && pos != null) {
                const employee_id = data.providerId;
                fetch(PRO_GET_PROFILE + employee_id, {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                })
                    .then((response) => response.json())
                    .then(async responseJson => {
                        var status;
                        if (responseJson && responseJson.result) {
                            database().ref('chatting').
                                child(senderId).
                                child(employee_id)
                                .once('value', data => {
                                    console.log("=============== Chat Request Accepted value once ==========");
                                    console.log(data);
                                    if (data) {
                                        const { dataChatSource } = this.props.messagesInfo;
                                        let newDataChatSource = Object.assign({}, dataChatSource);
                                        let newArr = newDataChatSource[employee_id] ? [...newDataChatSource[employee_id]] : [];
                                        newArr.push(data.val())
                                        const newData = [...newArr];
                                        //filter out only unique messages
                                        const uniqueData = Array.from(new Set(newData.map(a => {
                                            if (a)
                                                return a.time
                                        })))
                                            .map(time => {
                                                return newData.find(a => {
                                                    if (a)
                                                        a.time === time
                                                })
                                            });
                                        newDataChatSource[employee_id] = uniqueData;
                                        fetchedMessages(newDataChatSource);
                                    }

                                });
                            database().ref('chatting').
                                child(senderId).
                                child(employee_id)
                                .on('child_added', data => {
                                    console.log("=============== Chat Request Accepted child_added on ==========");
                                    console.log(data);
                                    if (data.val()) {
                                        const { messagesInfo: { dataChatSource } } = this.props;
                                        let newDataChatSource = Object.assign({}, dataChatSource);
                                        let newArr = newDataChatSource[employee_id] ? [...newDataChatSource[employee_id]] : [];
                                        newArr.push(data.val());
                                        const newData = [...newArr];
                                        //filter out only unique messages
                                        const uniqueData = Array.from(new Set(newData.map(a => {
                                            if (a)
                                                return a.time
                                        })))
                                            .map(time => {
                                                return newData.find(a => {
                                                    if (a) return a.time === time
                                                })
                                            });
                                        newDataChatSource[employee_id] = uniqueData;
                                        fetchedMessages(newDataChatSource);
                                    }

                                });
                            var providerData = {
                                providerId: responseJson.data.id,
                                name: responseJson.data.username,
                                email: responseJson.data.email,
                                password: responseJson.data.password,
                                imageSource: responseJson.data.image,
                                surname: responseJson.data.surname,
                                mobile: responseJson.data.mobile,
                                services: responseJson.data.services,
                                description: responseJson.data.description,
                                address: responseJson.data.address,
                                lat: responseJson.data.lat,
                                lang: responseJson.data.lang,
                                invoice: responseJson.data.invoice,
                                status: status != undefined ? status : responseJson.data.status,
                                fcmId: responseJson.data.fcm_id,
                                accountType: responseJson.data.account_type
                            }
                            var pendingJobData = {
                                id: data.mainId,
                                order_id: data.orderId,
                                employee_id: providerData.providerId,
                                image: providerData.imageSource,
                                fcm_id: providerData.fcmId,
                                name: providerData.name,
                                surName: providerData.surname,
                                mobile: providerData.mobile,
                                description: providerData.description,
                                address: providerData.address,
                                lat: providerData.lat,
                                lang: providerData.lang,
                                service_name: data.serviceName,
                                chat_status: data.chat_status,
                                status: data.status,
                                delivery_address: data.delivery_address,
                                delivery_lat: data.delivery_lat,
                                delivery_lang: data.delivery_lang,
                            }
                            imageExists(providerData.imageSource).then(res => {
                                pendingJobData.imageAvailable = res;
                            });
                            newJobRequests[pos] = pendingJobData;
                            fetchedPendingJobInfo(newJobRequests);
                            this.showToast("Demande de chat acceptée");
                            updateActiveRequest(false);
                            navigation.navigate('Dashboard');
                        }
                    })
                    .catch(error => {
                        console.log(JSON.stringify(responseJson));
                    });
            }
            else if (title == "Chat Request Rejected") {
                this.showToast("Le fournisseur de services a rejeté votre demande. Veuillez réessayer plus tard")
            }
            else if ((title == "No Response" || title == "Canceled") && pos != null) {
                newJobRequests.splice(pos, 1);
                fetchedPendingJobInfo(newJobRequests);
                this.showToast("Le fournisseur de services n'a pas répondu à votre demande. Veuillez réessayer plus tard")
            }
        });

        allJobRequestsClient.map(obj => {
            const { employee_id } = obj;
            database().ref('chatting').
                child(senderId).
                child(employee_id)
                .once('value', data => {
                    if (data) {
                        const { dataChatSource } = this.props.messagesInfo;
                        let newDataChatSource = Object.assign({}, dataChatSource);
                        let newArr = newDataChatSource[employee_id] ? [...newDataChatSource[employee_id]] : [];
                        newArr.push(data.val())
                        const newData = [...newArr];
                        //filter out only unique messages
                        const uniqueData = Array.from(new Set(newData.map(a => {
                            if (a)
                                return a.time
                        })))
                            .map(time => {
                                return newData.find(a => {
                                    if (a)
                                        a.time === time
                                })
                            });
                        newDataChatSource[employee_id] = uniqueData;
                        fetchedMessages(newDataChatSource);
                    }

                });
            database().ref('chatting').
                child(senderId).
                child(employee_id)
                .on('child_added', data => {
                    if (data.val()) {
                        const { messagesInfo: { dataChatSource } } = this.props;
                        let newDataChatSource = Object.assign({}, dataChatSource);
                        let newArr = newDataChatSource[employee_id] ? [...newDataChatSource[employee_id]] : [];
                        newArr.push(data.val());
                        const newData = [...newArr];
                        //filter out only unique messages
                        const uniqueData = Array.from(new Set(newData.map(a => {
                            if (a)
                                return a.time
                        })))
                            .map(time => {
                                return newData.find(a => {
                                    if (a) return a.time === time
                                })
                            });
                        newDataChatSource[employee_id] = uniqueData;
                        fetchedMessages(newDataChatSource);
                    }

                });

        });
        /** fetch users current position and upload it to db */
        this.getCurrentPosition(senderId);

        /** lookout for users changing position start */
        geolocation.watchPosition(info => {
            const { coords: { latitude, longitude } } = info;
            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
            fetchedCoordinates({ latitude, longitude });
            userRef.update({ latitude, longitude }).then(() => {
                //fetchedCoordinates({ latitude, longitude });
            }).
                catch(e => {
                    console.log(e.message);
                    fetchCoordinatesError(e.message);
                })
        }, error => {
            console.log(error)
        }, { enableHighAccuracy: true });
        /** end lookout for pros changing position */

        this.fetchEmployeeLocations();
        /**Should be removed when fcm is confirmed working well */
        database().ref('chatting').child(senderId).on('child_changed', result => {
            const { notificationsInfo } = this.props;
            let currentMessagesCount = notificationsInfo.messages;
            let newMessagesCount = currentMessagesCount + 1;
            fetchedNotifications({ type: 'messages', value: newMessagesCount });
        });

        database().ref('adminChatting').child(senderId).on('child_changed', result => {
            const { notificationsInfo } = this.props;
            const adminMessageCount = notificationsInfo.adminMessages;
            Android ? Notifications.postLocalNotification({
                title: "Harfa Messages",
                body: "You have a new message!",
                extra: "data"
            }) :
                Notifications.postLocalNotification({
                    body: "You have a new Message",
                    title: "Harfa Messages",
                    sound: "chime.aiff",
                    silent: false,
                    category: "SOME_CATEGORY",
                    userInfo: {}
                });
            fetchedNotifications({ type: 'adminMessages', value: adminMessageCount });
        });

        const { updateOnlineStatus, updateConnectivityStatus } = this.props

        NetInfo.addEventListener(status => {
            updateConnectivityStatus(status.isConnected);
        });
        NetInfo.fetch().then(status => {
            updateConnectivityStatus(status.isConnected);
        });
        socket.on('connect', () => {
            const userId = userDetails.userId;
            if (userId) {
                socket.emit('connected', userId);
                updateOnlineStatus(true)
            }
        });
        socket.on('user-disconnected', users => {
            console.log('user disconnected');
            updateLiveChatUsers(users);
            OnlineUsers.Users = users;
        })
        socket.on('user-joined', users => {
            console.log('user joined')
            updateLiveChatUsers(users);
            OnlineUsers.Users = users;
        })
        socket.on("chat-message", data => {
            const { sender } = cloneDeep(data);
            const { notificationsInfo, messagesInfo, dbMessagesFetched } = this.props;
            let newMessages = cloneDeep(messagesInfo.messages);
            let currentMessagesCount = notificationsInfo.messages;
            let prevMessages = cloneDeep(newMessages[sender]);
            let prevMessage = prevMessages.pop();
            if (JSON.stringify(prevMessage) === JSON.stringify(data)) console.log('repeated message')
            else {
                let newMessagesCount = currentMessagesCount + 1;
                fetchedNotifications({ type: 'messages', value: newMessagesCount });
                newMessages[sender].push(data);
                dbMessagesFetched(newMessages);
            }

        });
        socket.on('disconnect', info => {
            console.log('disconnection info --', info)
            updateLiveChatUsers({});
            const { generalInfo: { online, connectivityAvailable } } = this.props
            updateOnlineStatus(false)
            if (!online && connectivityAvailable) socket.open();
        });
        socket.open();
    }

    componentDidUpdate() {
        const {
            jobsInfo: { jobRequests }
        } = this.props;
        if (jobRequests && !this.state.employeesLocationsFetched)
            this.fetchEmployeeLocations();
    }

    componentWillUnmount() {
        const { userInfo: { userDetails } } = this.props;
        const senderId = userDetails.userId;

        database().ref('adminChatting').child(senderId).off('child_added')
        database().ref('adminChatting').child(senderId).off('child_changed')
        database().ref('chatting').child(senderId).off('child_changed');
    }

    getCurrentPosition = async (senderId) => {
        const userRef = database().ref(`liveLocation/${senderId}`);
        if (Platform.OS == 'ios') {
            await geolocation.requestAuthorization();
            geolocation.watchPosition(info => {
                const { coords: { latitude, longitude } } = info;
                const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
                fetchedCoordinates({ latitude, longitude });
                userRef.update({ latitude, longitude }).then(() => {
                    //fetchedCoordinates({ latitude, longitude });
                }).
                    catch(e => {
                        console.log(e.message);
                        fetchCoordinatesError(e.message);
                    })
            }, error => {
                console.log(error)
            }, { enableHighAccuracy: true });
        }
        else {
            const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            if (granted) {
                geolocation.watchPosition(info => {
                    const { coords: { latitude, longitude } } = info;
                    const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
                    fetchedCoordinates({ latitude, longitude });
                    userRef.update({ latitude, longitude }).then(() => {
                        //fetchedCoordinates({ latitude, longitude });
                    }).
                        catch(e => {
                            console.log(e.message);
                            fetchCoordinatesError(e.message);
                        })
                }, error => {
                    console.log(error)
                }, { enableHighAccuracy: true });
            }
            else {
                try {
                    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                        geolocation.watchPosition(info => {
                            const { coords: { latitude, longitude } } = info;
                            const { fetchingCoordinates, fetchedCoordinates, fetchCoordinatesError } = this.props
                            fetchedCoordinates({ latitude, longitude });
                            userRef.update({ latitude, longitude }).then(() => {
                                //fetchedCoordinates({ latitude, longitude });
                            }).
                                catch(e => {
                                    console.log(e.message);
                                    fetchCoordinatesError(e.message);
                                })
                        }, error => {
                            console.log(error)
                        }, { enableHighAccuracy: true });

                    } else {
                        console.log("location permission denied")
                    }
                } catch (err) {
                    console.warn(err)
                }
            }
        }
    }

    checkForUserType = async () => {
        await AsyncStorage.getItem('userType').then(result => {
            if (!result)
                this.props.navigation.navigate('AfterSplash');

        });
    }

    checkNoficationsAvailability = async () => {
        if (Platform.OS === 'android') {
            try {
                const authStatus = await messaging().requestPermission();
                const fcmToken = await messaging().getToken();
                if (fcmToken) {
                    const enabled =
                        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
                    if (enabled) {
                        console.log('Notificationd enabled');
                        messaging()
                            .getInitialNotification()
                            .then(remoteMessage => {
                                if (remoteMessage) {
                                    console.log(
                                        'Notification caused app to open from quit state:',
                                        remoteMessage.notification,
                                    );
                                    //setInitialRoute(remoteMessage.data.type);
                                }
                            });
                    }
                    else {
                        try {
                            await messaging().requestPermission();
                            console.log('FCM permission granted')
                        }
                        catch (error) {
                            console.log('FCM Permission Error', error);
                        }
                    }
                }
                else {
                    console.log('FCM Token not available');
                }
            } catch (e) {
                console.log('Error initializing FCM', e);
            }
        }
    }

    fetchEmployeeLocations = () => {
        const {
            fetchingOthersCoordinates,
            fetchedOthersCoordinates,
            fetchOthersCoordinatesError,
            jobsInfo: { jobRequests }
        } = this.props;
        jobRequests.map(obj => {
            const { employee_id } = obj;
            database().ref(`liveLocation/${employee_id}`).once('value', result => {
                const { generalInfo: { othersCoordinates } } = this.props;
                let newOthersCoordinates = Object.assign({}, othersCoordinates);
                const loc = result.val();
                newOthersCoordinates[employee_id] = loc;
                fetchedOthersCoordinates(newOthersCoordinates);
            }).
                catch(e => {
                    fetchOthersCoordinatesError(e.message);
                });

            database().ref(`liveLocation/${employee_id}`).
                on('child_changed', () => {
                    const { generalInfo: { othersCoordinates } } = this.props;
                    let newOthersCoordinates = Object.assign({}, othersCoordinates);
                    fetchingOthersCoordinates();
                    database().ref(`liveLocation/${employee_id}`).
                        once('value', result => {
                            newOthersCoordinates[employee_id] = result.val();
                            fetchedOthersCoordinates(newOthersCoordinates);
                        }).
                        catch(e => {
                            fetchOthersCoordinatesError(e.message);
                        });
                });
        });
        this.setState({ employeesLocationsFetched: true });
    }

    showToast = message => {
        Toast.show(message, Toast.SHORT);
    }

    render() {
        const {
            text,
            navigation,
            notificationsInfo
        } = this.props;
        const notificationTotal = notificationsInfo.messages + notificationsInfo.generic + notificationsInfo.adminMessages;
        return (
            <>
                <NavigationEvents
                    onDidFocus={() => this.checkForUserType()}
                />
                <TouchableOpacity onPress={navigation ? () => navigation.dispatch(DrawerActions.openDrawer()) : () => { }}
                    style={styles.touchableHighlight}>
                    <Image style={styles.image}
                        source={require('../icons/humberger.png')} />
                    {notificationTotal > 0 ? <Text style={styles.noticationsCount}>{notificationTotal}</Text> : null}
                </TouchableOpacity>

                <View style={styles.textView}>
                    <Text style={styles.titleText}>
                        {text}
                    </Text>
                </View>
            </>
        )
    }
}

const mapStateToProps = state => {
    return {
        notificationsInfo: state.notificationsInfo,
        messagesInfo: state.messagesInfo,
        generalInfo: state.generalInfo,
        jobsInfo: state.jobsInfo,
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
        fetchMessages: () => {
            dispatch(startFetchingMessages());
        },
        fetchedMessages: data => {
            dispatch(messagesFetched(data));
        },
        fetchingMessagesError: error => {
            dispatch(messagesError(error));
        },
        fetchingCoordinates: () => {
            dispatch(updatingCoordinates())
        },
        fetchedCoordinates: data => {
            dispatch(updateCoordinates(data))
        },
        fetchCoordinatesError: error => {
            dispatch(updateCoordinatesError(error))
        },
        fetchingOthersCoordinates: () => {
            dispatch(updatingOthersCoordinates())
        },
        fetchedOthersCoordinates: data => {
            dispatch(updateOthersCoordinates(data))
        },
        fetchOthersCoordinatesError: error => {
            dispatch(updateOthersCoordinatesError(error))
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
        },
        updateOnlineStatus: val => {
            dispatch(updateOnlineStatus(val));
        },
        updateConnectivityStatus: val => {
            dispatch(updateConnectivityStatus(val));
        },
        updateLiveChatUsers: val => {
            dispatch(updateLiveChatUsers(val));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Hamburger);

const styles = StyleSheet.create({
    touchableHighlight: {
        width: 50,
        height: 50,
        borderRadius: 50,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 15,
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
    textView: {
        display: 'flex',
        flexDirection: 'column',
        textAlignVertical: 'center',
        marginTop: !Android ? 13 : 0
    },
    image: {
        width: 25,
        height: 25
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
        textAlignVertical: 'center',
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    }
});