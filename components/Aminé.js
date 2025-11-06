import { StyleSheet, Text, View } from "react-native";


const TodoItem = () => {

    return(
        <View style= {styles.item}>
            <Text style= {styles.title}>My To Do List</Text>
            <Text style= {styles.text}>- Learn react native</Text>
            <Text style= {styles.text}>- Build a static UI</Text>
            <Text style= {styles.text}>- Practice with StyleSheet</Text>
            <Text style= {styles.text}>- J'en ai marre</Text>
            <Text style= {styles.text}>- J'ai envie de die</Text>
            <Text style= {styles.text}>- J'ai mal à la tête</Text>
             <Text style= {styles.text}>- J'ai faim</Text>
        </View>
    );
};

//aminé
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  nom: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default TodoItem;