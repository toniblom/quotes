import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList} from 'react-native';
import { MD3LightTheme as DefaultTheme, Text, Snackbar, TextInput, PaperProvider, Card, HelperText, Button, Appbar } from 'react-native-paper';
import { TabsProvider, Tabs, TabScreen } from 'react-native-paper-tabs';
import * as SQLite from 'expo-sqlite';
import * as Speech from 'expo-speech';

const db = SQLite.openDatabase('quotedb.db');

export default function App() {

  const [quoteData, setQuoteData] = useState(["quote", "author"]);
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [lines, setLines] = useState([]);
  const [quoteInput, setQuoteInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');

  // Get random quote on startup
  useEffect(() => {
    getQuote()
  }, []);

  // Update quote and author
  useEffect(() => {
    setQuote(quoteData[0])
    setAuthor(quoteData[1])
  }, [quoteData]);

  // SQLITE DATABASE OPERATIONS

  // Create the database
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('create table if not exists line (id integer primary key not null unique, quote text, author text);');
    }, null, updateList);
  }, []);

  // Save item
  const saveItem = () => {
    db.transaction(tx => {
      tx.executeSql('insert into line (quote, author) values (?, ?);', [quote, author]);
    }, null, updateList
    )
    showAddSnack()
  }

  const saveOwnItem = () => {
    setQuoteInput("")
    setAuthorInput("")
    db.transaction(tx => {
      tx.executeSql('insert into line (quote, author) values (?, ?);', [quoteInput, authorInput]);
    }, null, updateList
    )
    showAddSnack()
  }

  // Update itemlist
  const updateList = () => {
    db.transaction(tx => {
      tx.executeSql('select * from line;', [], (_, { rows }) =>
        setLines(rows._array)
      );
    });
  }

  // Delete item
  const deleteItem = (id) => {
    db.transaction(
      tx => {
        tx.executeSql(`delete from line where id = ?;`, [id]);
      }, null, updateList
    )
    showDelSnack()
  }

  // GET A RANDOM QUOTE FUNCTIONALITY
  // Parameters for getQuote function
  const url = 'https://quotes15.p.rapidapi.com/quotes/random/';
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'b055805dfamshf515f779e74afdcp11c2d5jsn15ebda7db3a0',
      'X-RapidAPI-Host': 'quotes15.p.rapidapi.com'
    }
  };

  // Get random quote
  const getQuote = () => {
    fetch(url, options)
      .then(response => response.json())
      .then(responseJson => setQuoteData([responseJson.content, responseJson.originator.name]))
      .catch(error => {
        Alert.alert('Error', error);
      });
  }

  // TEXT TO SPEECH
  const speak = (text) => {
    Speech.speak(text);
  };

  // SNACKBAR MESSAGES

  const [delSnackVisible, setDelSnackVisible] = useState(false);
  const showDelSnack = () => setDelSnackVisible(!delSnackVisible);
  const hideDelSnack = () => setDelSnackVisible(false);

  const [addSnackVisible, setAddSnackVisible] = useState(false);
  const showAddSnack = () => setAddSnackVisible(!addSnackVisible);
  const hideAddSnack = () => setAddSnackVisible(false);


  // RENDER CARDS IN FLATLIST / MY QUOTES TAB
  renderItem = ({ item }) => (
    <Card style={{ margin: 2 }}>
      <Card.Content>
        <Text>{item.quote}</Text>
        <Text></Text>
        <Text>- {item.author}</Text>
      </Card.Content>
      <Card.Actions>
        {/* <Button icon="share">Share</Button> */}
        <Button onPress={() => speak(item.quote)}>Speak</Button>
        <Button buttonColor='red' onPress={() => deleteItem(item.id)}>Delete</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="Quote App" />
      </Appbar.Header>

      <TabsProvider defaultIndex={0}>
        <Tabs style={{}}>

          {/* RANDOM QUOTE TAB */}
          <TabScreen label="Random" icon="comment-quote">
            <View style={styles.randomContainer}>
              <View style={styles.quote}>
                <Text variant="bodyLarge">{quote}</Text>
                <Text></Text>
                <Text variant="bodySmall">- {author}</Text>
              </View>
              <View style={styles.buttons}>
                <View style={styles.button}>
                  <Button mode="contained" buttonColor={theme.colors.secondary} onPress={getQuote}>
                    Get a random quote
                  </Button>
                </View>
                <View style={styles.button}>
                  <Button mode="contained" onPress={saveItem}>
                    Save quote
                  </Button>
                </View>
                <Snackbar
                  style={styles.snackbar}
                  visible={addSnackVisible}
                  onDismiss={hideAddSnack}
                  duration={2000}
                >
                  Quote saved
                </Snackbar>
              </View>
            </View>
          </TabScreen>

          {/* MY QUOTES TAB */}
          <TabScreen label="My quotes" icon="book-open-outline">
            <View style={styles.container}>
              <FlatList
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                data={lines}
              />
              <Snackbar
                style={styles.snackbar}
                visible={delSnackVisible}
                onDismiss={hideDelSnack}
                duration={2000}
              >
                Quote deleted
              </Snackbar>
            </View>
          </TabScreen>

          {/* ADD QUOTE TAB */}
          <TabScreen label="Add quote" icon="pen-plus">
            <View style={styles.container}>
              <TextInput
                multiline
                numberOfLines={10}
                maxLength={500}
                mode="outlined"
                label="Quote"
                placeholder='Type quote here'
                value={quoteInput}
                onChangeText={text => setQuoteInput(text)}
              />
              <HelperText type="info" visible>
                {quoteInput.length}/500
              </HelperText>
              <TextInput
                mode="outlined"
                label="Author"
                placeholder='Type author here'
                value={authorInput}
                onChangeText={text => setAuthorInput(text)}
              />
              <Text></Text>
              <Button icon="content-save" mode="contained" onPress={saveOwnItem}>
                Save quote
              </Button>
              <Snackbar
                style={styles.snackbar}
                visible={addSnackVisible}
                onDismiss={hideAddSnack}
                duration={2000}
              >
                Quote saved
              </Snackbar>
            </View>
          </TabScreen>
        </Tabs>
      </TabsProvider>
    </PaperProvider>
  );
}

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'teal',
    secondary: 'sienna',
  },
  roundness: 2,
};

const styles = StyleSheet.create({
  randomContainer: {
    flex: 1,
    backgroundColor: 'azure',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  quote: {
    marginVertical: 10,
    padding: 50,
    borderWidth: 1,
    width: '90%',
    height: '90%',
  },
  button: {
    margin: 2,
  },
  buttons: {
    flexDirection: 'row',
  },
  snackbar: {
    flex: 1,
    width: '50%',
  }
});

