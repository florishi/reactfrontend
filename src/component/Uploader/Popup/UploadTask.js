import React, { useCallback, useMemo, useState } from "react";
import {
    Divider,
    Grow,
    IconButton,
    ListItem,
    ListItemText,
    makeStyles,
    Tooltip,
} from "@material-ui/core";
import TypeIcon from "../../FileManager/TypeIcon";
import { useUpload } from "../UseUpload";
import { Status } from "../core/uploader/base";
import { UploaderError } from "../core/errors";
import { filename, sizeToString } from "../../../utils";
import { darken, lighten } from "@material-ui/core/styles/colorManipulator";
import { useTheme } from "@material-ui/core/styles";
import Chip from "@material-ui/core/Chip";
import DeleteIcon from "@material-ui/icons/Delete";
import RefreshIcon from "@material-ui/icons/Refresh";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { navigateTo } from "../../../actions";
import { useDispatch } from "react-redux";
import Link from "@material-ui/core/Link";
import PlayArrow from "@material-ui/icons/PlayArrow";
import withStyles from "@material-ui/core/styles/withStyles";
import MuiExpansionPanel from "@material-ui/core/ExpansionPanel";
import MuiExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import MuiExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import TaskDetail from "./TaskDetail";

const useStyles = makeStyles((theme) => ({
    progressContent: {
        position: "relative",
        zIndex: 9,
    },
    progress: {
        transition: "width .4s linear",
        zIndex: 1,
        height: "100%",
        position: "absolute",
        left: 0,
        top: 0,
    },
    progressContainer: {
        position: "relative",
    },
    listAction: {
        marginLeft: 20,
        marginRight: 20,
    },
    fileName: {
        wordBreak: "break-all",
        [theme.breakpoints.up("sm")]: {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
        },
    },
    successStatus: {
        color: theme.palette.success.main,
    },
    errorStatus: {
        color: theme.palette.warning.main,
        wordBreak: "break-all",
        [theme.breakpoints.up("sm")]: {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
        },
    },
    disabledBadge: {
        marginLeft: theme.spacing(1),
        height: 18,
    },
    delete: {
        zIndex: 9,
    },
    dstLink: {
        color: theme.palette.success.main,
        fontWeight: 600,
    },
    fileNameContainer: {
        display: "flex",
        alignItems: "center",
    },
}));

const ExpansionPanel = withStyles({
    root: {
        maxWidth: "100%",
        boxShadow: "none",
        "&:not(:last-child)": {
            borderBottom: 0,
        },
        "&:before": {
            display: "none",
        },
        "&$expanded": {
            margin: 0,
        },
    },
    expanded: {},
})(MuiExpansionPanel);

const ExpansionPanelSummary = withStyles({
    root: {
        minHeight: 0,
        padding: 0,
        display: "block",
        "&$expanded": {},
    },
    content: {
        margin: 0,
        display: "block",
        "&$expanded": {
            margin: "0",
        },
    },
    expanded: {},
})(MuiExpansionPanelSummary);

const ExpansionPanelDetails = withStyles((theme) => ({
    root: {
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 8,
        paddingBottom: 8,
        display: "block",
        backgroundColor: theme.palette.background.default,
    },
}))(MuiExpansionPanelDetails);

const getSpeedText = (speed, speedAvg, useSpeedAvg) => {
    let displayedSpeed = speedAvg;
    if (!useSpeedAvg) {
        displayedSpeed = speed;
    }

    return `${sizeToString(displayedSpeed ? displayedSpeed : 0)} /s`;
};

const getErrMsg = (error) => {
    let errMsg = error.message;
    if (error instanceof UploaderError) {
        errMsg = error.Message("");
    }

    return errMsg;
};

export default function UploadTask({
    uploader,
    useAvgSpeed,
    onCancel,
    onClose,
    selectFile,
}) {
    const classes = useStyles();
    const theme = useTheme();
    const [taskHover, setTaskHover] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const { status, error, progress, speed, speedAvg, retry } = useUpload(
        uploader
    );
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const NavigateTo = useCallback((k) => dispatch(navigateTo(k)), [dispatch]);
    const navigateToDst = (path) => {
        onClose(null, "backdropClick");
        NavigateTo(path);
    };

    const toggleDetail = (event, newExpanded) => {
        setExpanded(!!newExpanded);
    };

    const statusText = useMemo(() => {
        const parent = filename(uploader.task.dst);
        switch (status) {
            case Status.added:
            case Status.initialized:
            case Status.queued:
                return <div>排队中...</div>;
            case Status.preparing:
                return <div>准备中...</div>;
            case Status.error:
                return (
                    <div className={classes.errorStatus}>
                        {getErrMsg(error)}
                        <br />
                    </div>
                );
            case Status.finishing:
                return <div>处理中...</div>;
            case Status.resumable:
                return (
                    <div>
                        {`已上传 ${sizeToString(
                            progress.total.loaded
                        )} , 共 ${sizeToString(
                            progress.total.size
                        )} - ${progress.total.percent.toFixed(2)}%`}
                    </div>
                );
            case Status.processing:
                if (progress) {
                    return (
                        <div>
                            {`${getSpeedText(
                                speed,
                                speedAvg,
                                useAvgSpeed
                            )} 已上传 ${sizeToString(
                                progress.total.loaded
                            )} , 共 ${sizeToString(
                                progress.total.size
                            )} - ${progress.total.percent.toFixed(2)}%`}
                        </div>
                    );
                }
                return <div>已上传 - </div>;
            case Status.finished:
                return (
                    <div className={classes.successStatus}>
                        已上传至{" "}
                        <Tooltip title={uploader.task.dst}>
                            <Link
                                className={classes.dstLink}
                                href={"javascript:void"}
                                onClick={() => navigateToDst(uploader.task.dst)}
                            >
                                {parent === "" ? "根目录" : parent}
                            </Link>
                        </Tooltip>
                        <br />
                    </div>
                );
            default:
                return <div>未知</div>;
        }
    }, [status, error, progress, speed, speedAvg, useAvgSpeed]);

    const resumeLabel = useMemo(
        () =>
            uploader.task.resumed && !fullScreen ? (
                <Chip
                    className={classes.disabledBadge}
                    size="small"
                    label={"断点续传"}
                />
            ) : null,
        [status, fullScreen]
    );

    const continueLabel = useMemo(
        () =>
            status === Status.resumable && !fullScreen ? (
                <Chip
                    className={classes.disabledBadge}
                    size="small"
                    color={"secondary"}
                    label={"可恢复进度"}
                />
            ) : null,
        [status, fullScreen]
    );

    const progressBar = useMemo(
        () =>
            (status === Status.processing ||
                status === Status.finishing ||
                status === Status.resumable) &&
            progress ? (
                <div
                    style={{
                        backgroundColor:
                            theme.palette.type === "light"
                                ? lighten(theme.palette.primary.main, 0.8)
                                : darken(theme.palette.background.paper, 0.2),
                        width: progress.total.percent + "%",
                    }}
                    className={classes.progress}
                />
            ) : null,
        [status, progress, theme]
    );

    const taskDetail = useMemo(() => {
        return (
            <TaskDetail
                error={error && getErrMsg(error)}
                navigateToDst={navigateToDst}
                uploader={uploader}
            />
        );
    }, [uploader, expanded]);

    const cancel = () => {
        setLoading(true);
        uploader.cancel().then(() => {
            setLoading(false);
            onCancel(uploader);
        });
    };

    const stopRipple = (e) => {
        e.stopPropagation();
    };

    const secondaryAction = useMemo(() => {
        if (!taskHover && !fullScreen) {
            return <></>;
        }

        const actions = [
            {
                show: status === Status.error,
                title: "重试",
                click: retry,
                icon: <RefreshIcon />,
                loading: false,
            },
            {
                show: true,
                title:
                    status === Status.finished ? "删除任务记录" : "取消并删除",
                click: cancel,
                icon: <DeleteIcon />,
                loading: loading,
            },
            {
                show: status === Status.resumable,
                title: "选取同样文件并恢复上传",
                click: () => selectFile(uploader.task.dst, uploader),
                icon: <PlayArrow />,
                loading: false,
            },
        ];

        return (
            <>
                {actions.map((a) => (
                    <>
                        {a.show && (
                            <Grow in={a.show}>
                                <Tooltip title={a.title}>
                                    <IconButton
                                        onMouseDown={stopRipple}
                                        onTouchStart={stopRipple}
                                        disabled={a.loading}
                                        onClick={() => a.click()}
                                    >
                                        {a.icon}
                                    </IconButton>
                                </Tooltip>
                            </Grow>
                        )}
                    </>
                ))}
            </>
        );
    }, [status, loading, taskHover, fullScreen, uploader]);

    return (
        <>
            <ExpansionPanel square expanded={expanded} onChange={toggleDetail}>
                <ExpansionPanelSummary
                    aria-controls="panel1d-content"
                    id="panel1d-header"
                >
                    <div
                        className={classes.progressContainer}
                        onMouseLeave={() => setTaskHover(false)}
                        onMouseOver={() => setTaskHover(true)}
                    >
                        {progressBar}
                        <ListItem className={classes.progressContent} button>
                            {!fullScreen && (
                                <TypeIcon
                                    fileName={uploader.task.name}
                                    isUpload
                                />
                            )}
                            <ListItemText
                                className={classes.listAction}
                                primary={
                                    <div className={classes.fileNameContainer}>
                                        <div className={classes.fileName}>
                                            {uploader.task.name}
                                        </div>
                                        <div>{resumeLabel}</div>
                                        <div>{continueLabel}</div>
                                    </div>
                                }
                                secondary={statusText}
                            />
                            {secondaryAction}
                        </ListItem>
                    </div>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>{taskDetail}</ExpansionPanelDetails>
            </ExpansionPanel>
            <Divider />
        </>
    );
}
