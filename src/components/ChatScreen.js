import React, { Component } from 'react';
import { connect } from 'react-redux';
import { startFetchingNotification, notificationsFetched, notificationError } from '../Redux/Actions/notificationActions';
import { startFetchingJobCustomer, fetchedJobCustomerInfo, fetchCustomerJobInfoError } from '../Redux/Actions/jobsActions';
import {
    View, StyleSheet, TouchableOpacity, Image, Text, FlatList, TextInput, Dimensions,
    ActivityIndicator, BackHandler, ImageBackground, StatusBar, Platform, Alert,
    KeyboardAvoidingView, ScrollView
} from 'react-native';
import database from '@react-native-firebase/database';
import Config from './Config';
import { cloneDeep } from 'lodash';
import { colorPrimary, colorPrimaryDark, colorYellow, colorGray, inactiveBackground, buttonPrimary, inactiveText, white } from '../Constants/colors';
import { imageExists } from '../misc/helpers';

const screenWidth = Dimensions.get('window').width;
//const screenHeight = Dimensions.get('window').height;
const ios = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = ios ? 20 : StatusBar.currentHeight;

const REJECT_ACCEPT_REQUEST = Config.baseURL + "jobrequest/updatejobrequest";
const SEND_NOTIFICATION = Config.baseURL + "notification/sendNotification";

const StatusBarPlaceHolder = () => {
    return (
        ios ?
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

const options = {
    title: 'Select a photo',
    takePhotoButtonTitle: 'Take a photo',
    chooseFromLibraryButtonTitle: 'Choose from gallery',
    quality: 1
};

class ChatScreen extends Component {
    constructor(props) {
        super();
        const { userInfo: { userDetails }, jobsInfo: { jobRequests }, messagesInfo: { dataChatSource, fetched }, navigation } = props;
        const employee_id = navigation.state.params.providerId;
        var currRequestPos = 0;
        Object.keys(jobRequests).map(key => {
            if (jobRequests[key].employee_id === employee_id) currRequestPos = key;
        });
        this.state = {
            senderId: userDetails.userId,
            senderImage: userDetails.image,
            senderName: userDetails.username,
            inputMessage: '',
            showButton: false,
            dataChatSource: dataChatSource[employee_id] === undefined ? [] : dataChatSource[employee_id],
            isLoading: !fetched,
            isUploading: false,
            isJobAccepted: jobRequests[currRequestPos].status === 'Accepted',
            requestStatus: jobRequests[currRequestPos].status,
            receiverId: employee_id,
            receiverName: navigation.state.params.providerName,
            receiverImage: navigation.state.params.providerImage,
            serviceName: navigation.state.params.serviceName,
            orderId: navigation.state.params.orderId,
            titlePage: navigation.state.params.titlePage,
            provider_FCM_id: navigation.state.params.fcmId,
            dataChatSourceSynced: false
        };
    };

    componentDidMount() {
        const { fetchedNotifications, navigation } = this.props;
        fetchedNotifications({ type: 'messages', value: 0 });
        navigation.addListener('willFocus', async () => {
            this.reInit();
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    reInit = () => {
        const { userInfo: { userDetails }, jobsInfo: { jobRequests }, messagesInfo: { dataChatSource, fetched }, navigation } = this.props;
        const employee_id = navigation.state.params.providerId;
        var currRequestPos = 0;
        Object.keys(jobRequests).map(key => {
            if (jobRequests[key].employee_id === employee_id) currRequestPos = key;
        });
        
        this.state = {
            senderId: userDetails.userId,
            senderImage: userDetails.image,
            senderName: userDetails.username,
            inputMessage: '',
            showButton: false,
            dataChatSource: dataChatSource[employee_id] === undefined ? [] : dataChatSource[employee_id],
            isLoading: !fetched,
            isUploading: false,
            isJobAccepted: jobRequests[currRequestPos].status === 'Accepted',
            requestStatus: jobRequests[currRequestPos].status,
            receiverId: employee_id,
            receiverName: navigation.state.params.providerName,
            receiverImage: navigation.state.params.providerImage,
            serviceName: navigation.state.params.serviceName,
            orderId: navigation.state.params.orderId,
            titlePage: navigation.state.params.titlePage,
            provider_FCM_id: navigation.state.params.fcmId,
            dataChatSourceSynced: false
        };
    }

    componentDidUpdate() {
        const { messagesInfo: { fetched, dataChatSource }, jobsInfo: { selectedJobRequest: { employee_id } } } = this.props;
        const { isLoading } = this.state;
        const localDataChatSource = this.state.dataChatSource;
        console.log("----------- Chat screen component did update ------------");
        console.log(fetched);
        console.log(isLoading);
        if (fetched && isLoading)
            this.setState({ isLoading: false });
        var chatHistory = dataChatSource[employee_id] === undefined ? [] : dataChatSource[employee_id];
        if (JSON.stringify(chatHistory) !== JSON.stringify(localDataChatSource)) {
            this.setState({ dataChatSource: chatHistory});
        }
            
    }

    handleBackButtonClick = () => {
        if (this.state.titlePage == 'MapDirection')
            this.props.navigation.navigate("MapDirection", {
                titlePage: "Chat"
            });
        else if (this.state.titlePage == 'ProviderDetails')
            this.props.navigation.navigate("ProviderDetails");
        return true;
    }

    convertTime = time => {
        let d = new Date(time);
        let c = new Date();
        let result = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':';
        result += (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        if (c.getDay() !== d.getDay()) {
            result = d.getDay() + '/' + d.getMonth() + "/" + d.getFullYear() + ', ' + result;
        }
        return result;
    }

    showHideButton = (input) => {

        this.setState({
            inputMessage: input,
        })
        if (input == '') {
            this.setState({
                showButton: false,
            })
        }
        else {
            this.setState({
                showButton: true,
            })
        }
    }

    sendMessageTask = async () => {
        const { inputMessage, senderId, senderName, senderImage, receiverId, receiverImage, provider_FCM_id, receiverName, serviceName, orderId } = this.state;
        if (this.state.inputMessage.length > 0) {
            this.setState({
                inputMessage: '',
                showButton: false,
            });
            let msgId = database().ref('chatting').child(senderId).child(receiverId).push().key;
            let updates = {};
            let recentUpdates = {};
            let message = {
                textMessage: inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
                senderId: senderId,
                senderImage: senderImage,
                senderName: senderName,
                receiverId: receiverId,
                receiverName: receiverName,
                receiverImage: receiverImage,
                serviceName: serviceName,
                orderId: orderId,
                type: "text",
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
            }
            let recentMessageReceiver = {
                textMessage: inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: senderId,
                name: senderName,
                image: senderImage,
                serviceName: serviceName,
                orderId: orderId,
                type: "text",
            }
            let recentMessageSender = {
                textMessage: inputMessage,
                imageMessage: '',
                time: database.ServerValue.TIMESTAMP,
                date: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
                id: receiverId,
                name: receiverName,
                image: receiverImage,
                serviceName: serviceName,
                orderId: orderId,
                type: "text",
            }
            updates['chatting/' + senderId + '/' + receiverId + '/' + msgId] = message;
            updates['chatting/' + receiverId + '/' + senderId + '/' + msgId] = message;
            database().ref().update(updates);

            recentUpdates['recentMessage/' + senderId + '/' + receiverId] = recentMessageSender;
            recentUpdates['recentMessage/' + receiverId + '/' + senderId] = recentMessageReceiver;

            database().ref().update(recentUpdates);

            const notification = JSON.stringify({
                "fcm_id": provider_FCM_id,
                "type": "Message",
                "user_id": senderId,
                "employee_id": receiverId,
                "order_id": orderId,
                "notification_by": "Client",
                "save_notification": "true",
                "title": "Message Recieved",
                "body": senderName + "has sent you a message!",
            });

            fetch(SEND_NOTIFICATION, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: notification
            }).
                then((response) => {
                    console.log('notif respons ', response)
                }).
                catch(error => {
                    console.log(error);
                });
        }

        this.setState({
            inputMessage: '',
            showButton: false,
        });
    }

    jobCancelTask = () => {
        const { fetchedPendingJobInfo, jobsInfo: { jobRequests, selectedJobRequest: { employee_id } } } = this.props;
        var currRequestPos;
        jobRequests.map((obj, key) => {
            const currEmpId = obj.employee_id;
            if (currEmpId === employee_id) currRequestPos = key;
        });
        var newJobRequests = cloneDeep(jobRequests);
        this.setState({
            isLoading: true
        });

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
                    user_id: this.state.receiverId,
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
                    })

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
                this.setState({
                    isLoading: false,
                });
            });
    }

    renderMessageItem = ({ item }) => {
        if (item) {
            const senderImage = item.senderImage;
            return (
                this.state.senderId != item.senderId
                    ?
                    item.type == 'text'
                        ?
                        <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', }}>
                            <View style={styles.itemLeftChatContainer}>
                                <View style={styles.itemChatImageView}>
                                    <Image style={{ width: 20, height: 20, borderRadius: 100, alignItems: 'center' }}
                                        source={{ uri: senderImage }} />
                                </View>
                                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 12, textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                        {item.textMessage}
                                    </Text>
                                    <Text style={{ fontSize: 8, textAlignVertical: 'center', color: 'black', marginLeft: 5 }}>
                                        {this.convertTime(item && item.time)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        : null
                    :
                    item.type == 'text'
                        ?
                        <View style={{ width: screenWidth, flex: 1, alignContent: 'flex-end', justifyContent: 'flex-end', alignItems: 'flex-end', }}>
                            <View style={styles.itemRightChatContainer}>
                                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 12, color: 'black', textAlignVertical: 'center', color: 'white' }}>
                                        {item.textMessage}
                                    </Text>
                                    <Text style={{
                                        fontSize: 8, color: 'black', textAlignVertical: 'center',
                                        color: 'white', marginRight: 5, marginTop: 4
                                    }}>
                                        {this.convertTime(item && item.time)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        : null
            )
        }
        return;
    }

    renderSeparator = () => {
        return (
            <View
                style={{ height: 5, width: '100%', }}>
            </View>
        );
    }

    render() {
        const { requestStatus, showButton } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior={ios ? 'padding' : null}>
                <StatusBarPlaceHolder />
                <ImageBackground style={styles.container}
                    source={require('../icons/bg_chat.png')}>

                    <View style={{
                        flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                        paddingLeft: 10, paddingRight: 20, paddingBottom: 5
                    }}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center' }}
                                onPress={() => this.props.navigation.goBack()}>
                                <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                    source={require('../icons/arrow_back.png')} />
                            </TouchableOpacity>

                            <Image style={{ width: 35, height: 35, borderRadius: 100, alignSelf: 'center', marginLeft: 10 }}
                                source={{ uri: this.state.receiverImage }} />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', alignSelf: 'center', marginLeft: 15 }}>
                                {this.state.receiverName + " "}{this.state.surname}
                            </Text>
                        </View>
                    </View>

                    <ScrollView style={{ marginBottom: requestStatus === 'Pending' ? 100 : 50 }} ref={ref => this.scrollView = ref}
                        contentContainerStyle={{
                            justifyContent: 'center', alignItems: 'center',
                            alwaysBounceVertical: true
                        }}
                        onContentSizeChange={(contentWidth, contentHeight) => {
                            this.scrollView.scrollToEnd({ animated: true })
                        }}
                        keyboardShouldPersistTaps='handled'
                        keyboardDismissMode='on-drag'>

                        <View style={{ flexDirection: 'column', marginBottom: 45 }}>
                            <View style={styles.listView}>
                                <FlatList
                                    numColumns={1}
                                    data={this.state.dataChatSource}
                                    renderItem={this.renderMessageItem}
                                    keyExtractor={(item, index) => index.toString()}
                                    showsVerticalScrollIndicator={false}
                                    extraData={this.state}
                                    ItemSeparatorComponent={this.renderSeparator}
                                    ref={(ref) => { this.myFlatListRef = ref }}
                                    onContentSizeChange={() => { 
                                        this.myFlatListRef.scrollToEnd({ animated: true });
                                     }}
                                    onLayout={() => { this.myFlatListRef.scrollToEnd({ animated: true }) }} />
                            </View>
                        </View>
                    </ScrollView>
                    {this.state.isLoading && (
                        <View style={styles.loaderStyle}>
                            <ActivityIndicator
                                style={{ height: 80 }}
                                color="#C00"
                                size="large" />
                        </View>
                    )}
                    <View style={[styles.footer, { minHeight: requestStatus === 'Pending' ? 120 : 50 }]}>
                        <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                        {requestStatus === 'Pending' ? <View style={{
                            flex: 1, width: screenWidth, justifyContent: 'center',
                            backgroundColor: 'white', alignItems: 'center'
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignContent: 'center' }}>
                                <TouchableOpacity style={styles.buttonContainer}
                                    onPress={this.jobCancelTask}>
                                    <Text style={styles.text}>Cancel Request</Text>
                                </TouchableOpacity>
                            </View>
                        </View> :
                            null}
                        <View style={{ flex: 1, flexDirection: 'row', }}>
                            <TextInput style={{ width: screenWidth - 90, fontSize: 16, marginLeft: 5, alignSelf: 'center' }}
                                placeholder='Tapez un message'
                                value={this.state.inputMessage}
                                multiline={true}
                                onChangeText={(inputMesage) => this.showHideButton(inputMesage)}>
                            </TextInput>

                            {/*<TouchableOpacity style={{
                                height: 50, justifyContent: 'center', alignItems: 'center',
                                alignContent: 'center', marginRight: 25
                            }}
                                onPress={this.selectPhoto.bind(this)}>
                                <Image style={{ width: 20, height: 20 }}
                                    source={require('../icons/camera.png')} />
                            </TouchableOpacity>*/}
                            <TouchableOpacity disabled={!showButton} style={{ backgroundColor: !showButton ? inactiveBackground : buttonPrimary, height: 50, justifyContent: 'center', alignItems: 'center', alignContent: 'center', position: 'absolute', end: 0 }}
                                onPress={this.sendMessageTask}>
                                <Text style={{ alignSelf: 'center', fontWeight: 'bold', color: !showButton ? inactiveText : white, fontSize: 16, paddingLeft: 10, paddingRight: 10 }}>
                                    ENVOYER
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {this.state.isJobAccepted && (
                            <View style={{
                                flexDirection: 'column', width: screenWidth, height: 50, backgroundColor: 'white',
                                borderRadius: 2, alignItems: 'center', justifyContent: 'flex-start',
                            }}>
                                <View style={{ width: screenWidth, height: 1, backgroundColor: colorGray }}></View>
                                <TouchableOpacity style={styles.textViewDirection}
                                    onPress={() => this.props.navigation.navigate("MapDirection", {
                                        "titlePage": "ProviderDetails"
                                    })}>
                                    <Image style={{ width: 20, height: 20, marginLeft: 20 }}
                                        source={require('../icons/mobile_gps.png')} />
                                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                                        Fournisseur de services de suivi
                                </Text>
                                    <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                                        source={require('../icons/right_arrow.png')} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ImageBackground>
            </KeyboardAvoidingView>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listView: {
        flex: 1,
        padding: 5,
    },
    footer: {
        width: screenWidth,
        flexDirection: 'column',
        backgroundColor: 'white',
        justifyContent: 'center',
        position: 'absolute', //Footer
        bottom: 0, //Footer
    },
    buttonContainer: {
        flex: 1,
        paddingTop: 10,
        backgroundColor: '#000000',
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 5,
        borderColor: colorYellow,
        borderWidth: 2,
        textAlign: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    text: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
        justifyContent: 'center',
    },
    itemLeftChatContainer: {
        maxWidth: (screenWidth / 2) + 30,
        flexDirection: 'row',
        backgroundColor: colorGray,
        padding: 10,
        borderRadius: 5,
        alignContent: 'center'
    },
    itemChatImageView: {
        width: 20,
        height: 20,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemRightChatContainer: {
        maxWidth: screenWidth / 2,
        flexDirection: 'row',
        backgroundColor: '#1E90FF',
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textViewDirection: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
        backgroundColor: 'white',
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 15,
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

const mapStateToProps = state => {
    return {
        messagesInfo: state.messagesInfo,
        jobsInfo: state.jobsInfo,
        userInfo: state.userInfo,
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
        fetchingPendingJobInfo: () => {
            dispatch(startFetchingJobCustomer());
        },
        fetchedPendingJobInfo: info => {
            dispatch(fetchedJobCustomerInfo(info));
        },
        fetchingPendingJobInfoError: error => {
            dispatch(fetchCustomerJobInfoError(error))
        },
        fetchingNotificationsError: error => {
            dispatch(notificationError(error));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatScreen);