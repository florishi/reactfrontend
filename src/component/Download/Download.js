import React, { Component } from "react";
import { connect } from "react-redux";
import ImageIcon from "@material-ui/icons/PhotoSizeSelectActual";
import VideoIcon from "@material-ui/icons/Videocam";
import AudioIcon from "@material-ui/icons/Audiotrack";
import PdfIcon from "@material-ui/icons/PictureAsPdf";
import RefreshIcon from "@material-ui/icons/Refresh";
import DeleteIcon from "@material-ui/icons/Delete";
import FileShowIcon from "@material-ui/icons/InsertDriveFile";
import {
    FileWordBox,
    FilePowerpointBox,
    FileExcelBox,
    ScriptText,
    MagnetOn,
    ZipBox,
    WindowRestore,
    Android
} from "mdi-material-ui";
import { toggleSnackbar } from "../../actions";
import axios from "axios";
import { sizeToString } from "../../untils";
import { mediaType } from "../../config";
import API, { baseURL } from "../../middleware/Api";
import {
    withStyles,
    Card,
    LinearProgress,
    CardContent,
    Typography,
    Button,
    IconButton
} from "@material-ui/core";
import DownloadingCard from "./DownloadingCard";
import FinishedCard from "./FinishedCard";

const styles = theme => ({
    actions: {
        display: "flex"
    },
    title: {
        marginTop: "20px"
    },
    layout: {
        width: "auto",
        marginTop: "30px",
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
        [theme.breakpoints.up(1100 + theme.spacing(3) * 2)]: {
            width: 700,
            marginLeft: "auto",
            marginRight: "auto"
        }
    },
    shareTitle: {
        maxWidth: "200px"
    },
    avatarFile: {
        backgroundColor: theme.palette.primary.light
    },
    avatarFolder: {
        backgroundColor: theme.palette.secondary.light
    },
    gird: {
        marginTop: "30px"
    },
    hide: {
        display: "none"
    },
    loadingAnimation: {
        borderRadius: "6px 6px 0 0"
    },
    shareFix: {
        marginLeft: "20px"
    },
    loadMore: {
        textAlign: "center",
        marginTop: "20px",
        marginBottom: "20px"
    },
    margin:{
        marginTop:theme.spacing(2),
    }
});
const mapStateToProps = state => {
    return {};
};

const mapDispatchToProps = dispatch => {
    return {
        toggleSnackbar: (vertical, horizontal, msg, color) => {
            dispatch(toggleSnackbar(vertical, horizontal, msg, color));
        }
    };
};

class DownloadComponent extends Component {
    page = 0;
    interval = 0;

    state = {
        downloading: [],
        loading: false,
        finishedList: [],
        continue: true
    };

    componentDidMount = () => {
        this.loadDownloading();
        this.loadMore();
    };

    componentWillUnmount() {
        clearTimeout(this.interval);
    }

    loadDownloading = () => {
        this.setState({
            loading: true
        });
        API.get("/aria2/downloading")
            .then(response => {
                this.setState({
                    downloading: response.data,
                    loading: false
                });
                // 设定自动更新
                clearTimeout(this.interval);
                if(response.data.length > 0){
                    this.interval = setTimeout(this.loadDownloading,1000 * response.data[0].interval);
                }
            })
            .catch(error => {
                this.props.toggleSnackbar(
                    "top",
                    "right",
                    error.message,
                    "error"
                );
            });
    };

    loadMore = () => {
        this.setState({
            loading: true
        });
        API
            .get("/aria2/finished?page=" + ++this.page)
            .then(response => {
                this.setState({
                    finishedList: [...this.state.finishedList,...response.data],
                    loading: false,
                    continue: response.data.length >= 10
                });
            })
            .catch(error => {
                this.props.toggleSnackbar("top", "right", "加载失败", "error");
                this.setState({
                    loading: false
                });
            });
    };

    render() {
        const { classes } = this.props;

        return (
            <div className={classes.layout}>
                <Typography
                    color="textSecondary"
                    variant="h4"
                    className={classes.title}
                >
                    进行中
                    <IconButton
                        disabled={this.state.loading}
                        onClick={this.loadDownloading}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Typography>
                {this.state.downloading.map((value, k) => (
                    <DownloadingCard key={ k } task={value} />
                ))}
                <Typography
                    color="textSecondary"
                    variant="h4"
                    className={classes.title}
                >
                    已完成
                </Typography>
                <div className={classes.loadMore}>
                    {this.state.finishedList.map((value, k) => {
                        if (value.files) {
                            return (
                                <FinishedCard key={k} task={value}/>
                            )
                        }

                    })}
                    <Button
                        size="large"
                        className={classes.margin}
                        disabled={!this.state.continue}
                        onClick={this.loadMore}
                    >
                        加载更多
                    </Button>
                </div>
            </div>
        );
    }
}

const Download = connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(DownloadComponent));

export default Download;
