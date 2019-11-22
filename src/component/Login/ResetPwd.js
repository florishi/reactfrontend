import React, { Component } from 'react'
import { connect } from 'react-redux'
import KeyIcon from '@material-ui/icons/VpnKeyOutlined';
import { toggleSnackbar, } from "../../actions/index"
import axios from 'axios'

import {
    withStyles,
    Button,
    FormControl,
    Divider,
    Link,
    Input,
    InputLabel,
    Paper,
    Avatar,
    Typography,
} from '@material-ui/core';

const styles = theme => ({
    layout: {
        width: 'auto',
        marginTop: '110px',
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
        [theme.breakpoints.up(1100 + theme.spacing(3) * 2)]: {
            width: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
        },
    },
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${theme.spacing(2)}px ${theme.spacing(3)}px ${theme.spacing(3)}px`,
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        marginTop: theme.spacing(3),
    },
    link: {
        marginTop: "10px",
        display:"flex",
        width: "100%",
        justifyContent: "space-between",
    },
    captchaContainer:{
        display:"flex",
        marginTop: "10px",
    }
})
const mapStateToProps = state => {
    return {
    }
}

const mapDispatchToProps = dispatch => {
    return {
        toggleSnackbar: (vertical, horizontal, msg, color) => {
            dispatch(toggleSnackbar(vertical, horizontal, msg, color))
        },
    }
}

class ResetPwdCompoment extends Component {

    state={
        email:"",
        captcha:"",
        loading:false,
        captchaUrl:"/captcha?initial",
    }

    refreshCaptcha = ()=>{
        this.setState({
            captchaUrl:"/captcha?"+Math.random(),
        });
    }

    login = e=>{
        e.preventDefault();
        this.setState({
            loading:true,
        });
        axios.post('/Member/ForgetPwd',{
            regEmail:this.state.email,
            captchaCode:this.state.captcha,
        }).then( (response)=> {
            if(response.data.code!=="200"){
                this.setState({
                    loading:false,
                });
                this.props.toggleSnackbar("top","right",response.data.message,"warning");
                this.refreshCaptcha();
            }else{
                this.setState({
                    loading:false,
                    email:"",
                });
                this.props.toggleSnackbar("top","right","密码重置邮件已发送，请注意查收","success");
            }
        })
        .catch((error) =>{
            this.setState({
                loading:false,
            });
            this.props.toggleSnackbar("top","right",error.message,"error");
            
            
        });
    }

    handleChange = name => event => {
        this.setState({ [name]: event.target.value });
    };
    

    render() {
        const { classes } = this.props;


        return (
            <div className={classes.layout}>
                <Paper className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <KeyIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        找回密码
                    </Typography>
                    <form className={classes.form} onSubmit={this.login}>
                        <FormControl margin="normal" required fullWidth>
                            <InputLabel htmlFor="email">注册邮箱</InputLabel>
                            <Input 
                            id="email" 
                            type="email" 
                            name="email" 
                            onChange={this.handleChange("email")} 
                            autoComplete
                            value={this.state.email}
                            autoFocus />
                        </FormControl>
                        {window.findPwdCaptcha==="1"&&
                        <div className={classes.captchaContainer}>
                            <FormControl margin="normal" required fullWidth>
                                <InputLabel htmlFor="captcha">验证码</InputLabel>
                                <Input 
                                name="captcha" 
                                onChange={this.handleChange("captcha")} 
                                type="text" 
                                id="captcha" 
                                value={this.state.captcha}
                                autoComplete />
                               
                            </FormControl> <div>
                                <img alt="captcha" src={this.state.captchaUrl} onClick={this.refreshCaptcha}></img>
                            </div>
                        </div>
                        }
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={this.state.loading}
                            className={classes.submit}
                        >
                            发送密码重置邮件
                        </Button>  </form>                          <Divider/>
                        <div className={classes.link}>
                            <div>
                                <Link href={"/Login"}>
                                    返回登录
                                </Link>
                            </div>
                            <div>
                                <Link href={"/SignUp"}>
                                    注册账号
                                </Link>
                            </div>
                        </div>
                    
                </Paper>
            </div>
        );
    }

}

const ResetPwd = connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(ResetPwdCompoment))

export default ResetPwd
