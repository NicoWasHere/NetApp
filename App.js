import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, ScrollView, TouchableOpacity, Button, AsyncStorage, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';


export default function App() {

  const [update,doUpdate] = React.useState(false)
  const [data, setData] = React.useState([])
  const [total, setTotal] = React.useState(0)
  const [secondTitle, setSecondTitle] = React.useState('')
  const [secondId, setSecondID] = React.useState(0)
  const [sortingMethod,setSortingMethod] = React.useState(0) //0: Alphabetical 1: High to Low 2: Low to High
  const [currentNavigator,setNavigator] = React.useState(null)


  React.useEffect(() => {
    AsyncStorage.getItem('data', (err, info) => {
      if (info != undefined) {
        setData(JSON.parse(info))
      }
    })
    updateTotal()
  }
    , [])

  React.useEffect(()=>{
    updateTotal()
    doUpdate(!update)
  },[data])

  const newPerson = (name) => {
    if (name.length) {
      let info = { 'name': name, 'balance': 0, 'history': [] }
      let temp = data
      temp.unshift(info)
      setData(temp)
      AsyncStorage.setItem('data', JSON.stringify(temp))
      doUpdate(!update) //temp solution
    }
  }

  const updateTotal = () => {
    let temp = 0
    data.forEach(element => {
      temp += Number(element.balance)
    })
    temp.toFixed(2)
    setTotal(temp)
  }

  const HomeScreen = ({ navigation }) => {
    const [search, onSearch] = React.useState('');
    return (
      <View style={HomepageStyle.container}>
        <ScrollView style={HomepageStyle.scrollView} keyboardDismissMode='on-drag'>
          <View style={HomepageStyle.topbar}>
            <Text style={HomepageStyle.title}>Net</Text>
          </View>
          <TextInput
            style={HomepageStyle.search}
            onChangeText={text => onSearch(text)}
            placeholder={'Search..'}
            value={search}
          />

          <Text style={{ fontSize: 40, fontWeight: '600', marginLeft: 20, marginBottom: 10 }}>${total.toFixed(2)}</Text>
          {data.map((person, i) => {
            if (person.name.indexOf(search) != -1) {
              return <TouchableOpacity key={i} onPress={() => navigation.navigate('Person', { data: person, id: i })}><View style={HomepageStyle.person}><Text style={HomepageStyle.personText} >{person.name}</Text><Text style={HomepageStyle.personBalance}>${person.balance}</Text></View></TouchableOpacity>
            }
          }
          )}
          <View style={HomepageStyle.person}/>
        </ScrollView>
      </View>
    );
  }


  const deletePerson = (id) =>{
    let temp = data
    temp.splice(id,1)
    setData(temp)
    AsyncStorage.setItem('data', JSON.stringify(temp))
    updateTotal()
    doUpdate(!update)
    currentNavigator.goBack()
    updateTotal()
  }

  const PersonScreen = ({ route, navigation }) => {
    const info = route.params.data
    setSecondTitle(info.name)
    setSecondID(route.params.id)
    setNavigator(navigation)
    return (
      <View style={PersonpageStyle.container}>
        <Text style={PersonpageStyle.title}>{info.name}</Text>
        <Text style={PersonpageStyle.balance}>${info.balance}</Text>
        <View style = {PersonpageStyle.buttonView}>
        <Button title='New Transaction' onPress={()=>navigation.navigate('Transaction')}/>
        </View>
        <View style={PersonpageStyle.transactionFrame} />
        <ScrollView style={PersonpageStyle.scrollView}>
          {info.history.map((transaction, i) => {
            return (<View key={i} style={PersonpageStyle.transactionFrame}><Text style={PersonpageStyle.transactionReason}>{transaction.reason}</Text><Text style={PersonpageStyle.transactionAmount}>${transaction.amount}</Text></View>)
          })}
        </ScrollView>
      </View>
    );
  }

  
  
  const TransactionScreen = ({route, navigation}) => {
    const [amount,setAmount] = React.useState('0')
    const [reason, setReason] = React.useState('')
    setNavigator(navigation)
    const handleAmount = (value) =>{
      if(value=='$'){setAmount('0')}
      else{
      value = value.split('$')[1]
      if(value.indexOf('.')!=-1&&value.split('.')[1].length>2){
       value=value.substring(0,value.indexOf('.')+3)
       setAmount(value)
      }
      if(value[0]=='0'&&value[1]!='.'){value=value.split('0')[1]}
      setAmount(value)
    }
    }
    const handlePress = (debt) =>{
      let balance = Number(amount).toFixed(2)
      if(debt){balance *= -1}
      if(balance==0){Alert.alert('Amount cannot be $0')}
      else if(reason == ''){Alert.alert('Reason cannot be blank')}
      else{
        let transaction = {
          'amount':balance,
          'reason':reason
        }
       let temp = data
       temp[secondId].history.unshift(transaction)
       temp[secondId].balance =  (Number(temp[secondId].balance)+ Number(balance)).toFixed(2)
       setData(temp)
       AsyncStorage.setItem('data',JSON.stringify(temp))
       updateTotal()
       doUpdate(!update)
       currentNavigator.goBack()
       
      }
    }
    return(
      <View style={newTransaction.container}>
        <Text style={newTransaction.title}>New Transaction</Text>
        <View style={{marginTop:10,marginBottom:20}}>
        <View style={newTransaction.pair}>
        <Text style={newTransaction.label}>Amount</Text>
        <TextInput
        placeholder = {'$0'}
        keyboardType={'numeric'}
        onChangeText={(number)=>handleAmount(number)}
        value={'$'+amount}
        contextMenuHidden={true}
        style={newTransaction.amountInput}
        />
        </View>
        <View style={newTransaction.pair}>
        <Text style={newTransaction.label}>Reason</Text>
        <TextInput
        placeholder = {'Ex. Ice Cream'}
        onChangeText={(text)=>setReason(text)}
        value={reason}
        style={newTransaction.reasonInput}
        />
        </View>
        </View>
        <View style={newTransaction.pair}>
        <TouchableOpacity onPress={()=>handlePress(true)} style={newTransaction.button}>
          <Text style={newTransaction.buttonText}>I owe them</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>handlePress(false)} style={newTransaction.button}>
          <Text style={newTransaction.buttonText}>They owe me</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const handleSort = () =>{
    Alert.alert(
      'Sort',
      '',
      [
        {text: 'Alphabetical: A-Z', onPress: () => setSortingMethod(0)},
        {text: 'Balance: High to Low',onPress: () => setSortingMethod(1)},
        {text: 'Balance: Low to High', onPress: () => setSortingMethod(2)},
        {text: 'Cancel', style: 'cancel'},
      ],
      {cancelable: true},
    );
  }

  const sort = () =>{
    let temp = data
    switch(sortingMethod){
      case 0: temp.sort((a,b)=>a.name.localeCompare(b.name))
        break;
      case 1: temp.sort((a,b)=>b.balance-a.balance)
        break;
      case 2: temp.sort((a,b)=>a.balance-b.balance)
        break;
    }
    setData(temp)
    AsyncStorage.setItem('data',JSON.stringify(temp))
    doUpdate(!update)
  }

  React.useEffect(()=>{
    if(data.length){
    sort()
  }
  },[sortingMethod])

  const Stack = createStackNavigator();
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator>
        <Stack.Screen options={{
          headerTitle: '', headerRight: () => (
            <Button onPress={() => { Alert.prompt('Full Name', null, (text) => newPerson(text)) }} title="Add Person" />),
          headerLeft: () => (<Button onPress={() => handleSort()} title="Sort" />),
          headerStyle: {shadowRadius: 0, shadowOffset: { height: 0, } }
        }} name="Home" component={HomeScreen} />
        <Stack.Screen name="Person" component={PersonScreen} options={{ headerTitle: secondTitle, headerRight: () => <Button onPress={() => { deletePerson(secondId) }} title='Delete' />}} />
        <Stack.Screen name='Transaction' component={TransactionScreen} options={{ headerTitle: "New Transaction", headerBackTitle: 'Cancel' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const HomepageStyle = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: 'hsl(0,0%,100%)',
  },
  topbar: {
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    flexDirection: 'row',

  },
  title: {
    fontSize: 50,
    fontWeight: "bold",
    margin: 20,
    marginTop: 0,
   
  },
  search: {
    borderColor: 'rgba(94, 94, 94, 1)',
    borderWidth: 2,
    alignSelf: "center",
    minWidth: '95%',
    padding: 10,
    borderRadius: 10,
    fontSize: 20,
    marginBottom: 10,

  },
  person: {
    borderTopWidth: 2,
    borderTopColor: 'rgb(94, 94, 94)',
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: 'center',
    // justifyContent: 'space-between',
    // height: 60
  },
  personText: {
    fontSize: 30,
    marginLeft: 20,
    flex: 7
   
  },
  personBalance: {
    fontSize: 30,
    marginRight: 20,
    textAlign: "right",
   flex: 4
  }
});

const PersonpageStyle = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'hsl(0,0%,100%)'
  },
  title: {
    fontSize: 50,
    fontWeight: "bold",
    marginTop: 20,
    alignSelf: "center"
  },
  balance: {
    fontSize: 50,
    alignSelf: "center",
    margin: 30,
  },
  transactionFrame: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: 'rgb(94, 94, 94)',
    paddingTop: 3,
    paddingBottom: 3
  },
  transactionReason: {
    fontSize: 30,
    marginLeft: 20,
    marginRight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flex: 7,
    textAlign:'left'
  },
  transactionAmount: {
    fontSize: 30,
    marginLeft: 20,
    marginRight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flex: 4,
    textAlign:'right'
  },
  buttonView: {
    paddingBottom:10,
  }
});

const newTransaction = StyleSheet.create({
  container:{
    padding:10,
    backgroundColor: 'hsl(0,0%,100%)',
    minHeight: '100%',
    flexDirection:'column',
   
  },
  pair:{
    flexDirection:"row",
    justifyContent: "space-between",
  },
  button:{
    flex: 1,
    backgroundColor:'hsl(139, 48%, 58%)',
    maxWidth: '48%',
    minHeight: 80,
    borderRadius: 10,
    justifyContent: "center"
  },
  buttonText:{
    textAlign: "center",
    alignContent: "center",
    fontSize: 25,
    fontWeight: "bold",
    color:'hsl(0,0%,100%)',
  },
  amountInput:{
    borderColor: 'rgba(94, 94, 94, 1)',
    borderWidth: 2,
    alignSelf: "center",
    padding: 10,
    borderRadius: 10,
    fontSize: 20,
    marginBottom: 10,
    flex: 4
  },
  reasonInput:{
    borderColor: 'rgba(94, 94, 94, 1)',
    borderWidth: 2,
    alignSelf: "center",
    flex: 4,
    padding: 10,
    borderRadius: 10,
    fontSize: 20,
    marginBottom: 10,
   
  },
  label:{
    fontSize: 30,
    fontWeight: "bold",
    flex: 3
    
  },
  title:{
    fontSize: 50,
    fontWeight: "bold",
    marginBottom: 20
  }
})