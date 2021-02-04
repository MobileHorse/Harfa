import React, { Component } from 'react';
import {StyleSheet, Text, View, Dimensions, TouchableOpacity, TouchableHighlight, Image, TextInput} from 'react-native'
import { AirbnbRating } from 'react-native-ratings';
import { colorGray, colorYellow, colorBg } from '../Constants/colors';


export default class DialogReview extends Component {
    constructor(props) {
      super();
      var data1 = props.data.split("//////");
      this.state = {
         data: JSON.parse(data1[0]),
         rating: ""+data1[1],
          review: '',
          width: Dimensions.get('window').width,
          isReviewDialogVisible: false
      }
      Dimensions.addEventListener('change', (e) => {
          this.setState(e.window);
      })
    };

    changeReviewDialogVisibility = bool => {
        this.setState({
            isReviewDialogVisible: bool
        });
    }

    closeReviewDialog= action => {
        if(action == 'Submit')
        {
            console.log("Submit");
            this.props.changeDialogVisibility(false,"Submitted","", this.state.rating, this.state.review);
        }
        else if(action == 'Not now')
        {
            console.log("Not now");
            this.props.changeDialogVisibility(false,"Not now","","","");
        }
    }

  render() {
    return (
        <TouchableOpacity activeOpacity={1} disabled={true} style={styles.contentContainer}>
            <View style={[styles.modal, {width: this.state.width - 80}]}>
                <View style={styles.textView}>
                    <Text style={[styles.text, {fontSize: 20}]}> Review </Text>
                    <View style={{width: this.state.width-100, height: 1, backgroundColor: colorGray}}></View>
                    
                    <Image style={{width: 45, height: 45, borderRadius: 100, marginTop: 15}}
                        source={{uri: this.state.data.user_details.image}}>
                    </Image>
                    <Text style={{fontSize: 16, fontWeight: 'bold', marginTop: 10}}>{this.state.data.user_details.username}</Text>
                 
                 <View style={{backgroundColor: colorBg, marginTop: 10}}>
                    <AirbnbRating
                        type='custom'
                        defaultRating={this.state.rating}
                        ratingCount={5}
                        size={20}
                        ratingBackgroundColor= {colorBg}
                        showRating={false}
                        onFinishRating={(rating1) => this.setState({rating : rating1})}/>
                 </View>
                    
                    <View>
                        <TextInput style={{width: this.state.width-120, height: 80, borderRadius: 5, 
                            borderColor: 'black', borderWidth:1, marginTop: 10, padding: 10}}
                            multiline={true}
                            placeholder='Additional comments'
                            onChangeText={(input) => this.setState({review: input})}>
                        </TextInput>
                    </View>
                </View>
                <View style={styles.buttonView}> 
                    <TouchableHighlight style={styles.touchableHighlight} 
                        onPress={ () => this.closeReviewDialog('Not now')}
                        underlayColor={'#f1f1f1'}>
                        <Text style={[styles.text, {color: colorYellow}]}> Not now </Text>
                    </TouchableHighlight>
                    <TouchableHighlight style={[styles.touchableHighlight, {backgroundColor:'black'}]} 
                        onPress={ () => this.closeReviewDialog('Submit')}
                        underlayColor={'#f1f1f1'}>
                        <Text style={[styles.text, {color: 'white'}]}> Submit </Text>
                    </TouchableHighlight>
                </View>
            </View>
        </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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