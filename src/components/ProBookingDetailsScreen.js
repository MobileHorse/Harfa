import React, { Component } from 'react';
import {
    View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, BackHandler, Modal, ToastAndroid,
    StatusBar, Platform,
} from 'react-native';
import { connect } from 'react-redux';
import WaitingDialog from './WaitingDialog';
import { AirbnbRating } from 'react-native-ratings';
import Toast from 'react-native-simple-toast';
import ReviewDialog from './ReviewDialog';
import Config from './Config';
import { setSelectedJobRequest } from '../Redux/Actions/jobsActions';
import { colorPrimary, colorPrimaryDark, colorBg } from '../Constants/colors';

const screenWidth = Dimensions.get('window').width;

const REVIEW_RATING = Config.baseURL + 'jobrequest/ratingreview';
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

class ProBookingDetailsScreen extends Component {
    constructor(props) {
        super();
        this.state = {
            isLoading: false,
            isErrorToast: false,
            bookingDetails: props.navigation.state.params.bookingDetails,
            isDialogLogoutVisible: false,
            mainId: '',
            fcm_id: props.navigation.state.params.bookingDetails.user_details.fcm_id,
            username: props.navigation.state.params.bookingDetails.user_details.username,
            customer_rating: props.navigation.state.params.bookingDetails.customer_rating,
            customer_review: props.navigation.state.params.bookingDetails.customer_review,
            employee_rating: props.navigation.state.params.bookingDetails.employee_rating,
            employee_review: props.navigation.state.params.bookingDetails.employee_review
        };
        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    };

    componentDidMount() {
        const { navigation } = this.props;
        navigation.addListener('willFocus', async () => {
            BackHandler.addEventListener('hardwareBackPress', () => this.handleBackButtonClick());
        });
        navigation.addListener('willBlur', () => {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
        });
    }

    handleBackButtonClick() {
        this.props.navigation.goBack();
        return true;
    }

    //Call also from ReviewDialog
    changeDialogVisibility = (bool, text, bookingDetails, rating, review) => {

        if (this.state.bookingDetails.employee_rating == '') {
            if (rating != '') {
                if (text == '') {

                    this.setState({
                        isDialogLogoutVisible: bool,
                        mainId: this.state.bookingDetails._id,
                    })
                }
                else {
                    if (text == "Not now") {
                        this.setState({
                            isDialogLogoutVisible: bool,
                        })
                    }
                    else if (text == "Submitted") {
                        this.setState({
                            isDialogLogoutVisible: bool,
                        })
                        this.reviewTask(rating, review);
                    }
                }
            }
            else {
                console.log("ELSE >>");
                if (text == "Not now") {
                    this.setState({
                        isDialogLogoutVisible: bool,
                    })
                }
                else if (text == "Submitted") {
                    this.setState({
                        isDialogLogoutVisible: bool,
                    })
                    this.reviewTask(rating, review);
                }
            }
        }
    }

    reviewTask(rating, review) {
        this.setState({
            isLoading: true,
            isErrorToast: false,
            employee_rating: rating,
            employee_review: review,
        });

        const reviewData = {
            "main_id": this.state.mainId,
            "type": "Employee",
            "rating": rating,
            "review": review,
            "notification": {
                "fcm_id": this.state.fcm_id,
                "type": "Review",
                "notification_by": "Employee",
                "title": "Given Review",
                "body": this.state.username + " has given you a review",
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
                console.log("Response reviewTask " + JSON.stringify(response));
                if (response.result) {
                    this.setState({
                        isErrorToast: false,
                        isLoading: false,
                        isReviewDialogVisible: false,
                        mainId: "",
                    })
                    //ToastAndroid.show("Review submitted", ToastAndroid.show);
                    this.showToast("Review submitted")
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
                })
            })
            .done()
    }

    showToast = (message) => {
        Toast.show(message);
    }

    changeWaitingDialogVisibility = (bool) => {
        this.setState({
            isLoading: bool
        })
    }

    render() {
        const { dispatchSelectedJobRequest } = this.props;
        return (
            <View style={styles.container}>

                <StatusBarPlaceHolder />

                <View style={{
                    flexDirection: 'row', width: '100%', height: 50, backgroundColor: colorPrimary,
                    paddingLeft: 10, paddingRight: 20, paddingTop: 5, paddingBottom: 5
                }}>
                    <View style={{ flex: 1, flexDirection: 'row', }}>
                        <TouchableOpacity style={{ width: 35, height: 35, alignSelf: 'center', justifyContent: 'center', }}
                            onPress={() => this.props.navigation.goBack()}>
                            <Image style={{ width: 20, height: 20, alignSelf: 'center' }}
                                source={require('../icons/arrow_back.png')} />
                        </TouchableOpacity>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', alignSelf: 'center', marginLeft: 10 }}>
                            Les détails de réservation
                    </Text>
                    </View>
                </View>

                <View style={styles.mainContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 15, marginLeft: 10 }}>
                        <Text style={{ color: 'grey', fontWeight: 'bold', fontSize: 14 }}>numéro de commande - {this.state.bookingDetails.order_id.replace("\"", "")}</Text>
                    </View>

                    <View style={{ width: screenWidth, height: 1, backgroundColor: colorBg, marginTop: 10 }}></View>

                    <View style={styles.providerDetailsContainer}>
                        <Image
                            style={{ height: 45, width: 45, alignSelf: 'flex-start', alignContent: 'flex-start', borderRadius: 100 }}
                            source={{ uri: this.state.bookingDetails.user_details.image }} />
                        <View style={{ flexDirection: 'column' }}>
                            <Text style={{ color: 'black', fontSize: 14, fontWeight: 'bold', textAlignVertical: 'center', marginLeft: 10, }}>
                                {this.state.bookingDetails.user_details.username}
                            </Text>
                            <View style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5 }}>
                                <Image
                                    style={{ height: 15, width: 15, alignSelf: 'center', alignContent: 'flex-start', borderRadius: 100, }}
                                    source={require('../icons/mobile.png')} />
                                <Text style={{ color: 'black', fontSize: 12, color: 'grey', textAlignVertical: 'center', marginLeft: 5 }}>
                                    {this.state.bookingDetails.user_details.mobile}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5 }}>
                                <Image
                                    style={{ height: 15, width: 15, alignSelf: 'center', alignContent: 'flex-start', borderRadius: 100, }}
                                    source={require('../icons/calendar.png')} />
                                <Text style={{ color: 'black', fontSize: 12, color: 'grey', textAlignVertical: 'center', marginLeft: 5 }}>
                                    {this.state.bookingDetails.user_details.dob}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginLeft: 10, marginTop: 5, marginRight: 50 }}>
                                <Text style={{ color: 'black', fontSize: 12, color: 'grey', textAlignVertical: 'center', }}>
                                    {this.state.bookingDetails.user_details.address}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 15, marginLeft: 10 }}>
                                <Text style={{ color: 'grey', fontWeight: 'bold', fontSize: 14 }}>{this.state.bookingDetails.createdDate}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ width: screenWidth, height: 1, backgroundColor: colorBg, marginTop: 10 }}></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 15, marginLeft: 10 }}>
                        <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 14 }}>Statut de l'évaluation du client</Text>
                    </View>
                    <View style={{ backgroundColor: 'white', marginTop: 10, marginBottom: 10, }}>
                        <AirbnbRating
                            type='custom'
                            ratingCount={5}
                            size={25}
                            defaultRating={this.state.customer_rating}
                            ratingBackgroundColor={colorBg}
                            showRating={false}
                            isDisabled={true}
                            onFinishRating={(rating) => console.log("Customer Rating : " + rating)} />
                    </View>

                    {this.state.customer_review != '' &&
                        <View>
                            <View style={{ width: screenWidth, height: 1, backgroundColor: colorBg, marginTop: 10 }}></View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 15, marginLeft: 10 }}>
                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 14 }}>Commentaires des clients</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 10, marginLeft: 10 }}>
                                <Text style={{ color: 'grey', fontSize: 14, paddingLeft: 5, paddingRight: 5, paddingBottom: 10, }}>{this.state.customer_review}</Text>
                            </View>
                        </View>
                    }

                    <View style={{ width: screenWidth, height: 1, backgroundColor: colorBg, marginTop: 10 }}></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 15, marginLeft: 10 }}>
                        <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 14 }}>Statut de l'évaluation du fournisseur</Text>
                    </View>
                    <View style={{ backgroundColor: 'white', marginTop: 10, marginBottom: 10, }}>
                        <AirbnbRating
                            type='custom'
                            ratingCount={5}
                            size={25}
                            defaultRating={this.state.employee_rating}
                            ratingBackgroundColor={colorBg}
                            showRating={false}
                            isDisabled={this.state.employee_rating != '' ? true : false}
                            onFinishRating={(rating) => {
                                this.setState({
                                    employee_rating: rating
                                })
                                this.changeDialogVisibility(true, "", this.state.bookingDetails, rating, "")
                            }
                            } />
                    </View>

                    {this.state.employee_review != '' &&
                        <View>
                            <View style={{ width: screenWidth, height: 1, backgroundColor: colorBg, marginTop: 10 }}></View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 15, marginLeft: 10 }}>
                                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 14 }}>Commentaires du fournisseur</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'flex-start', marginTop: 10, marginLeft: 10 }}>
                                <Text style={{ color: 'grey', fontSize: 14, paddingLeft: 5, paddingRight: 5, paddingBottom: 10, }}>{this.state.employee_review}</Text>
                            </View>
                        </View>
                    }

                </View>

                <TouchableOpacity style={styles.chatView}
                    onPress={() => {
                        dispatchSelectedJobRequest({ user_id: this.state.bookingDetails.user_id });
                        this.props.navigation.navigate("ProChatAfterBookingDetails", {
                            'receiverId': this.state.bookingDetails.user_id,
                            'receiverName': this.state.bookingDetails.user_details.username,
                            'receiverImage': this.state.bookingDetails.user_details.image,
                            'orderId': this.state.bookingDetails.order_id,
                            'serviceName': this.state.bookingDetails.service_details.service_name,
                            'pageTitle': "ProBookingDetails",
                        })
                    }
                    }>
                    <Image style={{ width: 20, height: 20, marginLeft: 20 }}
                        source={require('../icons/chatting.png')} />
                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginLeft: 10 }}>
                        Historique du chat
                </Text>
                    <Image style={{ width: 20, height: 20, marginLeft: 20, position: "absolute", end: 0, marginRight: 15 }}
                        source={require('../icons/right_arrow.png')} />
                </TouchableOpacity>

                <Modal transparent={true} visible={this.state.isDialogLogoutVisible} animationType='fade'
                    onRequestClose={() => this.changeDialogVisibility(false, "", "", "", "", "")}>
                    <ReviewDialog style={{
                        shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.75, shadowRadius: 5, elevation: 5,
                    }}
                        changeDialogVisibility={this.changeDialogVisibility}
                        data={JSON.stringify(this.state.bookingDetails) + "//////" + this.state.employee_rating} />
                </Modal>

                <Modal transparent={true} visible={this.state.isLoading} animationType='fade'
                    onRequestClose={() => this.changeWaitingDialogVisibility(false)}>
                    <WaitingDialog changeWaitingDialogVisibility={this.changeWaitingDialogVisibility} />
                </Modal>
            </View>
        );
    }
}

const mapStateToProps = state => ({
    jobsInfo: state.jobsInfo
});

const mapDispatchToProps = dispatch => ({
    dispatchSelectedJobRequest: job => {
        dispatch(setSelectedJobRequest(job));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(ProBookingDetailsScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorBg,
    },
    mainContainer: {
        width: screenWidth,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 2,
        marginTop: 10
    },
    providerDetailContainer: {
        width: screenWidth,
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 10,
    },
    providerDetailsContainer: {
        width: screenWidth,
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 10,
    },
    chatView: {
        flexDirection: 'row',
        width: screenWidth,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 5,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
})