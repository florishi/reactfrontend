import {
    Button, Dialog,
    DialogActions,
    DialogContent, DialogTitle, withStyles
} from "@material-ui/core";
import IconButton from '@material-ui/core/IconButton';
import {Slider,List,Grid} from '@material-ui/core';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MusicNote from '@material-ui/icons/MusicNote';
import PlayArrow from '@material-ui/icons/PlayArrow';
import PlayNext from '@material-ui/icons/SkipNext';
import PlayPrev from '@material-ui/icons/SkipPrevious';
import Pause from '@material-ui/icons/Pause';
import {Repeat, RepeatOne, Shuffle} from '@material-ui/icons';
import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { showAudioPreview ,audioPreviewSetIsOpen, audioPreviewSetPlaying} from "../../actions/index";
import { audioPreviewSuffix } from "../../config";
import { baseURL } from "../../middleware/Api";
import * as explorer from "../../redux/explorer/reducer";
import pathHelper from "../../utils/page";



const styles = (theme) => ({  
    list: {
        //maxWidth: 360,
        backgroundColor: theme.palette.background.paper,
        position: 'relative',
        overflow: 'auto',
        maxHeight: 300,
    },
    slider_root:{
        "vertical-align": "middle",
    },
});

const mapStateToProps = (state) => {
    return {
        first: state.explorer.audioPreview.first,
        other: state.explorer.audioPreview.other,
        isOpen:state.explorer.audioPreview.isOpen,
        playingName:state.explorer.audioPreview.playingName,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        showAudioPreview: (first) => {
            dispatch(showAudioPreview(first));
        },
        audioPreviewSetIsOpen: (first) => {
            dispatch(audioPreviewSetIsOpen(first));
        },
        audioPreviewSetPlaying: (playingName,paused) => {
            dispatch(audioPreviewSetPlaying(playingName,paused));
        },
    };
};

class MusicPlayerComponent extends Component {
    state = {
        items: [],
        currentIndex: 0,
        //isOpen: false,
        //isPlay:false,
        currentTime:0,
        duration:0,
        progressText:'00:00/00:00',
        looptype:0,
    };
    myAudioRef = React.createRef();  

    UNSAFE_componentWillReceiveProps = (nextProps) => {
        const items = [];
        let firstOne = 0;
        if (nextProps.first.id !== "") {
            if (
                pathHelper.isSharePage(this.props.location.pathname) &&
                !nextProps.first.path
            ) {
                const newItem = {
                    intro: nextProps.first.name,
                    src: baseURL + "/share/preview/" + nextProps.first.key,
                };
                firstOne = 0;
                items.push(newItem);
                this.setState({
                    currentIndex: firstOne,
                    items: items,
                    //isOpen: true,
                });
                this.props.audioPreviewSetIsOpen(true);
                return;
            }
            // eslint-disable-next-line
            nextProps.other.map((value) => {
                const fileType = value.name.split(".").pop().toLowerCase();
                if (audioPreviewSuffix.indexOf(fileType) !== -1) {
                    let src = "";
                    if (pathHelper.isSharePage(this.props.location.pathname)) {
                        src = baseURL + "/share/preview/" + value.key;
                        src =
                            src +
                            "?path=" +
                            encodeURIComponent(
                                value.path === "/"
                                    ? value.path + value.name
                                    : value.path + "/" + value.name
                            );
                    } else {
                        src = baseURL + "/file/preview/" + value.id;
                    }
                    const newItem = {
                        intro: value.name,
                        src: src,
                    };
                    if (
                        value.path === nextProps.first.path &&
                        value.name === nextProps.first.name
                    ) {
                        firstOne = items.length;
                    }
                    items.push(newItem);
                }
            });
            this.setState({
                currentIndex: firstOne,
                items: items,
                //isOpen: true,
            });
            this.props.audioPreviewSetIsOpen(true);
            this.props.showAudioPreview(explorer.initState.audioPreview.first);
        }        
    };

    handleItemClick = (currentIndex) => () => {
        this.setState({
            currentIndex: currentIndex,
        });
    };
    

    handleClose = () => {
        /*this.setState({
            isOpen: false,
        });*/
        this.setState({
            currentIndex: -1,
        });
        this.pause();
        this.props.audioPreviewSetPlaying(null,false);
        this.props.audioPreviewSetIsOpen(false);
    };
    backgroundPlay = () => {        
        this.props.audioPreviewSetIsOpen(false);
    };

    componentDidMount() {
        if(this.myAudioRef.current){
            this.bindEvents(this.myAudioRef.current);
        }
    }
    componentDidUpdate() {
        if(this.myAudioRef.current){
            this.bindEvents(this.myAudioRef.current);
        }
    }    
    componentWillUnmount() {
        this.unbindEvents(this.myAudioRef.current)
    }

    bindEvents=(ele)=>{
        if(ele){
            ele.addEventListener('canplay', this.readyPlay)
            ele.addEventListener('ended', this.loopnext)
            ele.addEventListener('timeupdate', this.timeUpdate)
        }
    };

    unbindEvents=(ele)=> {
        if(ele){
            ele.removeEventListener('canplay', this.readyPlay)
            ele.removeEventListener('ended', this.loopnext)
            ele.removeEventListener('timeupdate', this.timeUpdate)
        }
    };

    readyPlay = () => {
        this.play();
    };

    formatTime = s => {
        if(isNaN(s))return "00:00";
        const minute = Math.floor(s / 60);
        const second = Math.floor(s % 60);
        return `${minute}`.padStart(2,'0')+':'+`${second}`.padStart(2,'0');
    }

    timeUpdate = () => {
        const currentTime=Math.floor(this.myAudioRef.current.currentTime);//this.myAudioRef.current.currentTime;//
        this.setState({
            currentTime: currentTime,
            duration: this.myAudioRef.current.duration,
            progressText: this.formatTime(currentTime)+'/'+this.formatTime(this.myAudioRef.current.duration)
        });
    }

    play = () => {
       this.myAudioRef.current.play();
       /*this.setState({
            isPlay: true
        });*/
        this.props.audioPreviewSetPlaying(this.state.items[this.state.currentIndex].intro,false);
    };

    pause = () => {
        if(this.myAudioRef.current){
            this.myAudioRef.current.pause();
        }
        /*this.setState({
            isPlay: false
        })*/
        this.props.audioPreviewSetPlaying(this.state.items[this.state.currentIndex]?.intro,true);
    };

    playOrPaues = () => {
        if (this.state.isPlay) {
            this.pause()
        } else {
            this.play()
        }
    };
    changeLoopType=()=>{
        let lt=this.state.looptype+1;
        if(lt>=3){
            lt=0;
        }
        this.setState({
            looptype: lt,
        });
    };
    loopnext=()=>{
        let index = this.state.currentIndex;
        if(this.state.looptype==0){//all
            index=index+1;
            if (index >= this.state.items.length) {
                index =  0;
            }
        }else if(this.state.looptype==1){//single
            //index=index;
        }else if(this.state.looptype==2){//random
            if(this.state.items.length<=2){
                index=index+1;
                if (index >= this.state.items.length) {
                    index =  0;
                }
            }else{
                while(index==this.state.currentIndex){
                    index=Math.floor(Math.random()*this.state.items.length);
                }
            }
        }
        if(this.state.currentIndex==index){
            this.myAudioRef.current.currentTime=0;
            this.play();
        }
        this.setState({
            currentIndex: index,
        });
    }

    prev = () => {
        let index = this.state.currentIndex - 1
        if (index < 0) {
            index = this.state.items.length - 1
        }
        this.setState({
            currentIndex: index,
        });
    };
    
    next = () => {
        let index = this.state.currentIndex + 1
        if (index >= this.state.items.length) {
            index =  0;
        }
        this.setState({
            currentIndex: index,
        });
    };

    handleProgress = (e, newValue) => {
        this.myAudioRef.current.currentTime=newValue;
    }
      

    render() {
        const { currentIndex, items } = this.state;
        const { isOpen,classes } = this.props;
        return (            
            <Dialog
                open={isOpen}
                onClose={this.backgroundPlay}
                aria-labelledby="form-dialog-title"
                maxWidth="xs"
                fullWidth
                keepMounted
            >
                <DialogTitle id="form-dialog-title">音频播放</DialogTitle>
                <DialogContent>
                    <List className={classes.list} dense>
                        {items.map((value,idx) => {
                            const labelId = `label-${value.intro}`;
                            return (
                                <ListItem key={value.src} dense button onClick={this.handleItemClick(idx)}
                                    selected={idx==currentIndex}>
                                    <ListItemIcon>
                                        {
                                            idx==currentIndex?(<PlayArrow/>):(<MusicNote/>)
                                        }
                                    </ListItemIcon>
                                    <ListItemText id={labelId} primary={`${value.intro}`} />
                                </ListItem>
                            );
                        })}
                    </List>
                    <audio ref={this.myAudioRef}                                 
                        src={items[currentIndex]?.src}
                        />
                    <div style={{"padding-top":8}}></div>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs>
                        <Slider classes={{"root":classes.slider_root}}
                            value={this.state.currentTime}
                            onChange={this.handleProgress}
                            step={1}
                            min={0}
                            max={this.state.duration}
                            aria-labelledby="continuous-slider" />
                        </Grid>
                        <Grid item>
                            {this.state.progressText}
                        </Grid>
                    </Grid>
                    <Grid container spacing={2} justifyContent="center" justify="center">
                        <Grid item>
                            <IconButton edge="end" aria-label="" onClick={this.changeLoopType}>
                                {
                                    this.state.looptype==0?(<Repeat/>):(this.state.looptype==1?(<RepeatOne/>):(<Shuffle />))
                                }
                            </IconButton>
                        </Grid>
                        <Grid item>
                            <IconButton edge="end" aria-label="" onClick={this.prev}>
                                <PlayPrev />
                            </IconButton>
                        </Grid>
                        <Grid item>
                            <IconButton edge="end" aria-label="" onClick={this.pause}>
                                <Pause />
                            </IconButton>
                        </Grid>
                        <Grid item>
                            <IconButton edge="end" aria-label="" onClick={this.play}>
                                <PlayArrow />
                            </IconButton>
                        </Grid>
                        <Grid item>
                            <IconButton edge="end" aria-label="" onClick={this.next}>
                                <PlayNext />
                            </IconButton>
                        </Grid>                                
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose}>退出播放</Button>
                    <Button onClick={this.backgroundPlay}>后台播放</Button>
                </DialogActions>
            </Dialog>
            
        );
    }
}

MusicPlayerComponent.propTypes = {
    classes: PropTypes.object.isRequired,
};

const MusicPlayer = connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(withRouter(MusicPlayerComponent)));

export default MusicPlayer;
