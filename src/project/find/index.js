import React from 'react';
import { TextInput,StyleSheet, View, Text,Alert,FlatList, Linking,Clipboard } from 'react-native';
import URL from '../../config/api/urls'
const API  = URL.panSou

class Find extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        num: 0,
        text: '',
        countTips:'',
        list: [],
        count:null,
        footer:null,
        goTop: false
    };
  }
  //开始搜索
  subSearch = ()=> {
    const { text } = this.state
    if(!text){
      this.setState({
        countTips:'',
        num: 0, list: [],
        count: null,top: false,
      })
    } else {
      //获取列表
      if(text.indexOf('pan.baidu.com')+1){
        this.setState({
          countTips: '查询中'
        },()=>{
          fetch(API(text).searchPwd).then(res=>res.json()).then(res=>{
            this.setState({
              countTips: res.pwd ? '查询到密码':'未查询到密码',
              list:res.pwd ?[{id:0, context:res.pwd}]:[],
            })
          }).catch(err=>{
            Alert.aler(null,'获取数据出错')
          })
        })
        return
      }
      const getList=()=>{
        fetch( API(text).search ).then( res=>res.json() ).then(res=>{
          this.setState({
            list: res,
            top: true,
            refreshing: false,
          })
        }).catch(err=>{
          Alert.aler(null,'获取数据出错')
        })
      }
      //获取数量
      const getCount = ()=>{
        fetch( API(text).count )
        .then(res=>res.json())
        .then(res=> {
          this.setState({
            count: res.count,
            footer:null,
            countTips:`关键词 ${text} 共搜索到 ${res.count} 条数据`,
          },()=>{ getList() })
        }).catch(err=>{
          Alert.aler(null,'获取数据出错')
        })
      }
      //入口
      this.setState({
        count: null,
        list:[],
        countTips:'正在搜索'
      },()=> {
        getCount()
      })
    }
  }
  //上拉加载数据
  fetchItem=()=>{
    const { list,num,text,count,footer } = this.state
    // alert((num+1)*30+'----'+count)
    if( (num+1)*30 >= count && footer){
      this.setState({
        footer:  null
      })
    }
    if( (num+1)*30 < count ){
      this.setState({
        footer:  <View style={styles.loading}><Text>正在加载</Text></View>
      },()=>{
          fetch(API(text,num+1).search )
          .then(res=>res.json())
          .then(res => {
              const newList = list.concat(res)
              this.setState({
                list:newList,
                num: num+1,
                footer:null
              })
          }).catch(err=>{
            Alert.aler(null,'获取数据出错')
          })
      })
    }
  }
  //根据id获取密码
  getPwd = (id)=>{
    fetch(API(id).getPwd).then(res=>res.json()).then(res=>{
      Clipboard.setString(res.pwd)
      Alert.alert(null, '密码为：'+ res.pwd + '，已复制至粘贴板，点击标题打开链接可直接粘贴')
    }).catch(err=>{
      Alert.aler(null,'获取密码出错')
    })
  }

  handleScroll=(e)=>{
    const { goTop } = this.state
    const offsetY = e.nativeEvent.contentOffset.y;
    if( offsetY>=800 && !goTop){
      this.setState({
        goTop:true
      })
    }
    if( offsetY<200 && goTop ){
      this.setState({
        goTop:false
      })
    }
  }
  goToTop=()=>{
    this._scrollView&&this._scrollView.scrollToIndex({index:0,viewOffset:0,viewPosition:0})
  }
  //渲染列表
  _renderList =()=>{
    const { list,footer } = this.state
    const listItem = (info)=> (
      <View style={styles.listItem}>
        <View>
          <Text style={{ color: '#0078ff', paddingTop: 5, paddingBottom: 5 }} numberOfLines={1} onPress={() => { info.item.url&&info.item.url.indexOf('http')!==-1?Linking.openURL(info.item.url):null }}>{`${info.index + 1}、${info.item.context.replace(/\s*/, '')}`} </Text>
        </View>
        <View style={{display:'flex',flexDirection:'row'}}>
          <Text style={{fontSize:12,marginRight:5}}> { info.item.ctime ? info.item.ctime.split(' ')[0] :'' }</Text>
          <Text style={{fontSize:12,marginRight:5,color:'#feb252'}} onPress={()=>{this.getPwd(info.item.id)}}> { info.item.has_pwd ?'查看密码': ''} </Text>
          <Text style={{fontSize:12,marginRight:5}}> { info.item.show ? info.item.show :'' }</Text>
        </View>
      </View>
    )
    const emptyItem = () => <Text style={[styles.listItem,{fontSize:12}]}> 无数据 </Text>
    const refresh = ()=> {
      this.setState({ 
        refreshing: true 
      },()=> {
        this.subSearch()
      })
    }
    return (
      <FlatList
        data = {list}
        renderItem = {listItem}
        onEndReachedThreshold = { 0.2 }
        onEndReached = {this.fetchItem}
        ListEmptyComponent = {emptyItem}
        refreshing = {this.state.refreshing || false}
        onRefresh = {refresh}
        onScroll={this.handleScroll}
        ListFooterComponent={footer}
        ref={component => this._scrollView = component}
        ItemSeparatorComponent = {() => <View><Text></Text></View>}
      />
    )
  }


  render() {
    const { list,top,countTips,goTop } = this.state
    let renderList = null
    if(list.length){
      renderList = this._renderList()
    }
    return (
      <View style= { styles.findPage }>
        <Text style= { top ? { margin:10 }:{ marginTop:100,marginBottom:10}}>
          百度网盘搜索
        </Text>
        <View style= {{ width:'60%',alignItems:'center',marginBottom:30,position:'relative'}}>
          <TextInput
            style= {styles.input}
            maxLength= {100}
            autoFocus= {true}
            returnKeyType= "search"
            placeholderTextColor= "#CCCCCC"
            placeholder= "输入关键词、百度网盘URL🔍"
            onSubmitEditing= {this.subSearch}
            onChangeText= {(text)=>{this.setState({ text })}} />
        </View>
        <View style={{ width:'100%',marginBottom:110}}>
          <Text style={{position:'absolute',top:-18,left:5,fontSize:10}}> {countTips} </Text>
          { renderList }
        </View>
        {
          goTop?
          <Text style={{position:'absolute',right:10,bottom:50,opacity:0.5,width:50,height:50,borderRadius:25,backgroundColor:'#ccc',textAlign:'center',lineHeight:50,fontSize:20}} onPress={this.goToTop}>⇧</Text>
          :null
        }
       
      </View>
    );
  }
}
export default Find

const styled = {
  findPage: {
    width:'100%',
    height:'100%',
    alignItems:'center',
    textAlign:'center',
    backgroundColor:'#f5f5f5',
  },
  input: {
    fontSize:12,
    width:'80%',
    height:30,
    padding:0,
    paddingLeft:5,
    paddingRight:5,
    borderWidth:1,
    borderRadius:5,
    borderColor:'#eee',
    borderStyle:'solid',
  },
  listItem: {
    height: 60,
    fontSize: 15,
    paddingLeft:10,
    paddingRight:20,
    color: '#5C5C5C',
    backgroundColor: '#ffffff', 
    textAlign: 'left',
  },
  loading:{
    height: 60,
    fontSize: 15,
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
  }
}
const styles = StyleSheet.create({...styled});