import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import PathSelector from "./PathSelector";
import API, { AppError } from "../../middleware/Api";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    withStyles,
} from "@material-ui/core";
import Loading from "../Modals/Loading";
import CopyDialog from "../Modals/Copy";
import DirectoryDownloadDialog from "../Modals/DirectoryDownload";
import CreatShare from "../Modals/CreateShare";
import { withRouter } from "react-router-dom";
import DecompressDialog from "../Modals/Decompress";
import CompressDialog from "../Modals/Compress";
import {
    closeAllModals,
    openLoadingDialog,
    refreshFileList,
    refreshStorage,
    setModalsLoading,
    toggleSnackbar,
} from "../../redux/explorer";
import OptionSelector from "../Modals/OptionSelector";
import { getDownloadURL } from "../../services/file";
import { Trans, withTranslation } from "react-i18next";

const styles = (theme) => ({
    wrapper: {
        margin: theme.spacing(1),
        position: "relative",
    },
    buttonProgress: {
        color: theme.palette.secondary.light,
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
    contentFix: {
        padding: "10px 24px 0px 24px",
    },
});

const mapStateToProps = (state) => {
    return {
        path: state.navigator.path,
        selected: state.explorer.selected,
        modalsStatus: state.viewUpdate.modals,
        modalsLoading: state.viewUpdate.modalsLoading,
        dirList: state.explorer.dirList,
        fileList: state.explorer.fileList,
        dndSignale: state.explorer.dndSignal,
        dndTarget: state.explorer.dndTarget,
        dndSource: state.explorer.dndSource,
        loading: state.viewUpdate.modals.loading,
        loadingText: state.viewUpdate.modals.loadingText,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        closeAllModals: () => {
            dispatch(closeAllModals());
        },
        toggleSnackbar: (vertical, horizontal, msg, color) => {
            dispatch(toggleSnackbar(vertical, horizontal, msg, color));
        },
        setModalsLoading: (status) => {
            dispatch(setModalsLoading(status));
        },
        refreshFileList: () => {
            dispatch(refreshFileList());
        },
        refreshStorage: () => {
            dispatch(refreshStorage());
        },
        openLoadingDialog: (text) => {
            dispatch(openLoadingDialog(text));
        },
    };
};

class ModalsCompoment extends Component {
    state = {
        newFolderName: "",
        newFileName: "",
        newName: "",
        selectedPath: "",
        selectedPathName: "",
        secretShare: false,
        sharePwd: "",
        shareUrl: "",
        downloadURL: "",
        remoteDownloadPathSelect: false,
        purchaseCallback: null,
    };

    handleInputChange = (e) => {
        this.setState({
            [e.target.id]: e.target.value,
        });
    };

    newNameSuffix = "";

    UNSAFE_componentWillReceiveProps = (nextProps) => {
        if (this.props.dndSignale !== nextProps.dndSignale) {
            this.dragMove(nextProps.dndSource, nextProps.dndTarget);
            return;
        }

        if (this.props.modalsStatus.rename !== nextProps.modalsStatus.rename) {
            const name = nextProps.selected[0].name;
            this.setState({
                newName: name,
            });
            return;
        }
    };

    scoreHandler = (callback) => {
        callback();
    };

    Download = () => {
        getDownloadURL(this.props.selected[0])
            .then((response) => {
                window.location.assign(response.data);
                this.onClose();
                this.downloaded = true;
            })
            .catch((error) => {
                this.props.toggleSnackbar(
                    "top",
                    "right",
                    error.message,
                    "error"
                );
                this.onClose();
            });
    };

    submitRemove = (e) => {
        e.preventDefault();
        this.props.setModalsLoading(true);
        const dirs = [],
            items = [];
        // eslint-disable-next-line
        this.props.selected.map((value) => {
            if (value.type === "dir") {
                dirs.push(value.id);
            } else {
                items.push(value.id);
            }
        });
        API.delete("/object", {
            data: {
                items: items,
                dirs: dirs,
            },
        })
            .then((response) => {
                if (response.rawData.code === 0) {
                    this.onClose();
                    setTimeout(this.props.refreshFileList, 500);
                } else {
                    this.props.toggleSnackbar(
                        "top",
                        "right",
                        response.rawData.msg,
                        "warning"
                    );
                }
                this.props.setModalsLoading(false);
                this.props.refreshStorage();
            })
            .catch((error) => {
                this.props.toggleSnackbar(
                    "top",
                    "right",
                    error.message,
                    "error"
                );
                this.props.setModalsLoading(false);
            });
    };

    submitMove = (e) => {
        if (e != null) {
            e.preventDefault();
        }
        this.props.setModalsLoading(true);
        const dirs = [],
            items = [];
        // eslint-disable-next-line
        this.props.selected.map((value) => {
            if (value.type === "dir") {
                dirs.push(value.id);
            } else {
                items.push(value.id);
            }
        });
        API.patch("/object", {
            action: "move",
            src_dir: this.props.selected[0].path,
            src: {
                dirs: dirs,
                items: items,
            },
            dst: this.DragSelectedPath
                ? this.DragSelectedPath
                : this.state.selectedPath === "//"
                ? "/"
                : this.state.selectedPath,
        })
            .then(() => {
                this.onClose();
                this.props.refreshFileList();
                this.props.setModalsLoading(false);
            })
            .catch((error) => {
                this.props.toggleSnackbar(
                    "top",
                    "right",
                    error.message,
                    "error"
                );
                this.props.setModalsLoading(false);
            })
            .then(() => {
                this.props.closeAllModals();
            });
    };

    dragMove = (source, target) => {
        if (this.props.selected.length === 0) {
            this.props.selected[0] = source;
        }
        let doMove = true;

        // eslint-disable-next-line
        this.props.selected.map((value) => {
            // 根据ID过滤
            if (value.id === target.id && value.type === target.type) {
                doMove = false;
                // eslint-disable-next-line
                return;
            }
            // 根据路径过滤
            if (
                value.path ===
                target.path + (target.path === "/" ? "" : "/") + target.name
            ) {
                doMove = false;
                // eslint-disable-next-line
                return;
            }
        });
        if (doMove) {
            this.DragSelectedPath =
                target.path === "/"
                    ? target.path + target.name
                    : target.path + "/" + target.name;
            this.props.openLoadingDialog(this.props.t("modals.processing"));
            this.submitMove();
        }
    };

    submitRename = (e) => {
        e.preventDefault();
        this.props.setModalsLoading(true);
        const newName = this.state.newName;

        const src = {
            dirs: [],
            items: [],
        };

        if (this.props.selected[0].type === "dir") {
            src.dirs[0] = this.props.selected[0].id;
        } else {
            src.items[0] = this.props.selected[0].id;
        }

        // 检查重名
        if (
            this.props.dirList.findIndex((value) => {
                return value.name === newName;
            }) !== -1 ||
            this.props.fileList.findIndex((value) => {
                return value.name === newName;
            }) !== -1
        ) {
            this.props.toggleSnackbar(
                "top",
                "right",
                this.props.t("modals.duplicatedObjectName"),
                "warning"
            );
            this.props.setModalsLoading(false);
        } else {
            API.post("/object/rename", {
                action: "rename",
                src: src,
                new_name: newName,
            })
                .then(() => {
                    this.onClose();
                    this.props.refreshFileList();
                    this.props.setModalsLoading(false);
                })
                .catch((error) => {
                    this.props.toggleSnackbar(
                        "top",
                        "right",
                        error.message,
                        "error"
                    );
                    this.props.setModalsLoading(false);
                });
        }
    };

    submitCreateNewFolder = (e) => {
        e.preventDefault();
        this.props.setModalsLoading(true);
        if (
            this.props.dirList.findIndex((value) => {
                return value.name === this.state.newFolderName;
            }) !== -1
        ) {
            this.props.toggleSnackbar(
                "top",
                "right",
                this.props.t("modals.duplicatedFolderName"),
                "warning"
            );
            this.props.setModalsLoading(false);
        } else {
            API.put("/directory", {
                path:
                    (this.props.path === "/" ? "" : this.props.path) +
                    "/" +
                    this.state.newFolderName,
            })
                .then(() => {
                    this.onClose();
                    this.props.refreshFileList();
                    this.props.setModalsLoading(false);
                })
                .catch((error) => {
                    this.props.setModalsLoading(false);

                    this.props.toggleSnackbar(
                        "top",
                        "right",
                        error.message,
                        "error"
                    );
                });
        }
        //this.props.toggleSnackbar();
    };

    submitCreateNewFile = (e) => {
        e.preventDefault();
        this.props.setModalsLoading(true);
        if (
            this.props.dirList.findIndex((value) => {
                return value.name === this.state.newFileName;
            }) !== -1
        ) {
            this.props.toggleSnackbar(
                "top",
                "right",
                this.props.t("modals.duplicatedFolderName"),
                "warning"
            );
            this.props.setModalsLoading(false);
        } else {
            API.post("/file/create", {
                path:
                    (this.props.path === "/" ? "" : this.props.path) +
                    "/" +
                    this.state.newFileName,
            })
                .then(() => {
                    this.onClose();
                    this.props.refreshFileList();
                    this.props.setModalsLoading(false);
                })
                .catch((error) => {
                    this.props.setModalsLoading(false);

                    this.props.toggleSnackbar(
                        "top",
                        "right",
                        error.message,
                        "error"
                    );
                });
        }
        //this.props.toggleSnackbar();
    };

    submitTorrentDownload = (e) => {
        e.preventDefault();
        this.props.setModalsLoading(true);
        API.post("/aria2/torrent/" + this.props.selected[0].id, {
            dst:
                this.state.selectedPath === "//"
                    ? "/"
                    : this.state.selectedPath,
        })
            .then(() => {
                this.props.toggleSnackbar(
                    "top",
                    "right",
                    this.props.t("modals.taskCreated"),
                    "success"
                );
                this.onClose();
                this.props.setModalsLoading(false);
            })
            .catch((error) => {
                this.props.toggleSnackbar(
                    "top",
                    "right",
                    error.message,
                    "error"
                );
                this.props.setModalsLoading(false);
            });
    };

    submitDownload = (e) => {
        e.preventDefault();
        this.props.setModalsLoading(true);
        API.post("/aria2/url", {
            url: this.state.downloadURL.split("\n"),
            dst:
                this.state.selectedPath === "//"
                    ? "/"
                    : this.state.selectedPath,
        })
            .then((response) => {
                const failed = response.data
                    .filter((r) => r.code !== 0)
                    .map((r) => new AppError(r.msg, r.code, r.error).message);
                if (failed.length > 0) {
                    this.props.toggleSnackbar(
                        "top",
                        "right",
                        this.props.t("modals.taskCreateFailed", {
                            failed: failed.length,
                            details: failed.join(","),
                        }),
                        "warning"
                    );
                } else {
                    this.props.toggleSnackbar(
                        "top",
                        "right",
                        this.props.t("modals.taskCreated"),
                        "success"
                    );
                }

                this.onClose();
                this.props.setModalsLoading(false);
            })
            .catch((error) => {
                this.props.toggleSnackbar(
                    "top",
                    "right",
                    error.message,
                    "error"
                );
                this.props.setModalsLoading(false);
            });
    };

    setMoveTarget = (folder) => {
        const path =
            folder.path === "/"
                ? folder.path + folder.name
                : folder.path + "/" + folder.name;
        this.setState({
            selectedPath: path,
            selectedPathName: folder.name,
        });
    };

    remoteDownloadNext = () => {
        this.props.closeAllModals();
        this.setState({
            remoteDownloadPathSelect: true,
        });
    };

    onClose = () => {
        this.setState({
            newFolderName: "",
            newFileName: "",
            newName: "",
            selectedPath: "",
            selectedPathName: "",
            secretShare: false,
            sharePwd: "",
            downloadURL: "",
            shareUrl: "",
            remoteDownloadPathSelect: false,
        });
        this.newNameSuffix = "";
        this.props.closeAllModals();
    };

    handleChange = (name) => (event) => {
        this.setState({ [name]: event.target.checked });
    };

    copySource = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(this.props.modalsStatus.getSource);
            this.props.toggleSnackbar(
                "top",
                "right",
                this.props.t("modals.linkCopied"),
                "info"
            );
        }
    };

    render() {
        const { classes, t } = this.props;

        return (
            <div>
                <Loading />
                <OptionSelector />
                <Dialog
                    open={this.props.modalsStatus.getSource}
                    onClose={this.onClose}
                    aria-labelledby="form-dialog-title"
                    fullWidth
                >
                    <DialogTitle id="form-dialog-title">
                        {t("modals.getSourceLinkTitle")}
                    </DialogTitle>

                    <DialogContent>
                        <TextField
                            autoFocus
                            inputProps={{ readonly: true }}
                            label={t("modals.sourceLink")}
                            multiline
                            value={this.props.modalsStatus.getSource}
                            variant="outlined"
                            fullWidth
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.copySource} color="secondary">
                            {t("copyToClipboard", { ns: "common" })}
                        </Button>
                        <Button onClick={this.onClose}>
                            {t("close", { ns: "common" })}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={this.props.modalsStatus.createNewFolder}
                    onClose={this.onClose}
                    aria-labelledby="form-dialog-title"
                >
                    <DialogTitle id="form-dialog-title">
                        {t("fileManager.newFolder")}
                    </DialogTitle>

                    <DialogContent>
                        <form onSubmit={this.submitCreateNewFolder}>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="newFolderName"
                                label={t("modals.folderName")}
                                type="text"
                                value={this.state.newFolderName}
                                onChange={(e) => this.handleInputChange(e)}
                                fullWidth
                            />
                        </form>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.onClose}>
                            {t("cancel", { ns: "common" })}
                        </Button>
                        <div className={classes.wrapper}>
                            <Button
                                onClick={this.submitCreateNewFolder}
                                color="primary"
                                disabled={
                                    this.state.newFolderName === "" ||
                                    this.props.modalsLoading
                                }
                            >
                                {t("modals.create")}
                                {this.props.modalsLoading && (
                                    <CircularProgress
                                        size={24}
                                        className={classes.buttonProgress}
                                    />
                                )}
                            </Button>
                        </div>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={this.props.modalsStatus.createNewFile}
                    onClose={this.onClose}
                    aria-labelledby="form-dialog-title"
                >
                    <DialogTitle id="form-dialog-title">
                        {t("fileManager.newFile")}
                    </DialogTitle>

                    <DialogContent>
                        <form onSubmit={this.submitCreateNewFile}>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="newFileName"
                                label={t("modals.fileName")}
                                type="text"
                                value={this.state.newFileName}
                                onChange={(e) => this.handleInputChange(e)}
                                fullWidth
                            />
                        </form>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.onClose}>
                            {t("cancel", { ns: "common" })}
                        </Button>
                        <div className={classes.wrapper}>
                            <Button
                                onClick={this.submitCreateNewFile}
                                color="primary"
                                disabled={
                                    this.state.newFileName === "" ||
                                    this.props.modalsLoading
                                }
                            >
                                {t("modals.create")}
                                {this.props.modalsLoading && (
                                    <CircularProgress
                                        size={24}
                                        className={classes.buttonProgress}
                                    />
                                )}
                            </Button>
                        </div>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={this.props.modalsStatus.rename}
                    onClose={this.onClose}
                    aria-labelledby="form-dialog-title"
                    maxWidth="sm"
                    fullWidth={true}
                >
                    <DialogTitle id="form-dialog-title">
                        {t("fileManager.rename")}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            <Trans
                                i18nKey="modals.renameDescription"
                                values={{
                                    name:
                                        this.props.selected.length === 1
                                            ? this.props.selected[0].name
                                            : "",
                                }}
                                components={[<strong key={0} />]}
                            />
                        </DialogContentText>
                        <form onSubmit={this.submitRename}>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="newName"
                                label={t("modals.newName")}
                                type="text"
                                value={this.state.newName}
                                onChange={(e) => this.handleInputChange(e)}
                                fullWidth
                            />
                        </form>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.onClose}>
                            {t("cancel", { ns: "common" })}
                        </Button>
                        <div className={classes.wrapper}>
                            <Button
                                onClick={this.submitRename}
                                color="primary"
                                disabled={
                                    this.state.newName === "" ||
                                    this.props.modalsLoading
                                }
                            >
                                {t("ok", { ns: "common" })}
                                {this.props.modalsLoading && (
                                    <CircularProgress
                                        size={24}
                                        className={classes.buttonProgress}
                                    />
                                )}
                            </Button>
                        </div>
                    </DialogActions>
                </Dialog>
                <CopyDialog
                    open={this.props.modalsStatus.copy}
                    onClose={this.onClose}
                    presentPath={this.props.path}
                    selected={this.props.selected}
                    modalsLoading={this.props.modalsLoading}
                />

                <Dialog
                    open={this.props.modalsStatus.move}
                    onClose={this.onClose}
                    aria-labelledby="form-dialog-title"
                >
                    <DialogTitle id="form-dialog-title">
                        {t("modals.moveToTitle")}
                    </DialogTitle>
                    <PathSelector
                        presentPath={this.props.path}
                        selected={this.props.selected}
                        onSelect={this.setMoveTarget}
                    />

                    {this.state.selectedPath !== "" && (
                        <DialogContent className={classes.contentFix}>
                            <DialogContentText>
                                <Trans
                                    i18nKey="modals.moveToDescription"
                                    values={{
                                        name: this.state.selectedPathName,
                                    }}
                                    components={[<strong key={0} />]}
                                />
                            </DialogContentText>
                        </DialogContent>
                    )}
                    <DialogActions>
                        <Button onClick={this.onClose}>
                            {t("cancel", { ns: "common" })}
                        </Button>
                        <div className={classes.wrapper}>
                            <Button
                                onClick={this.submitMove}
                                color="primary"
                                disabled={
                                    this.state.selectedPath === "" ||
                                    this.props.modalsLoading
                                }
                            >
                                {t("ok", { ns: "common" })}
                                {this.props.modalsLoading && (
                                    <CircularProgress
                                        size={24}
                                        className={classes.buttonProgress}
                                    />
                                )}
                            </Button>
                        </div>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={this.props.modalsStatus.remove}
                    onClose={this.onClose}
                    aria-labelledby="form-dialog-title"
                >
                    <DialogTitle id="form-dialog-title">
                        {t("modals.deleteTitle")}
                    </DialogTitle>

                    <DialogContent>
                        <DialogContentText>
                            {this.props.selected.length === 1 && (
                                <Trans
                                    i18nKey="modals.deleteOneDescription"
                                    values={{
                                        name: this.props.selected[0].name,
                                    }}
                                    components={[<strong key={0} />]}
                                />
                            )}
                            {this.props.selected.length > 1 &&
                                t("modals.deleteMultipleDescription", {
                                    num: this.props.selected.length,
                                })}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.onClose}>
                            {t("cancel", { ns: "common" })}
                        </Button>
                        <div className={classes.wrapper}>
                            <Button
                                onClick={this.submitRemove}
                                color="primary"
                                disabled={this.props.modalsLoading}
                            >
                                {t("ok", { ns: "common" })}
                                {this.props.modalsLoading && (
                                    <CircularProgress
                                        size={24}
                                        className={classes.buttonProgress}
                                    />
                                )}
                            </Button>
                        </div>
                    </DialogActions>
                </Dialog>

                <CreatShare
                    open={this.props.modalsStatus.share}
                    onClose={this.onClose}
                    modalsLoading={this.props.modalsLoading}
                    setModalsLoading={this.props.setModalsLoading}
                    selected={this.props.selected}
                />
                <Dialog
                    open={this.props.modalsStatus.remoteDownload}
                    onClose={this.onClose}
                    aria-labelledby="form-dialog-title"
                    fullWidth
                >
                    <DialogTitle id="form-dialog-title">
                        {t("modals.newRemoteDownloadTitle")}
                    </DialogTitle>

                    <DialogContent>
                        <DialogContentText>
                            <TextField
                                label={t("modals.remoteDownloadURL")}
                                autoFocus
                                fullWidth
                                multiline
                                id="downloadURL"
                                onChange={this.handleInputChange}
                                placeholder={t(
                                    "modals.remoteDownloadURLDescription"
                                )}
                            />
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.onClose}>
                            {t("cancel", { ns: "common" })}
                        </Button>
                        <Button
                            onClick={this.remoteDownloadNext}
                            color="primary"
                            disabled={
                                this.props.modalsLoading ||
                                this.state.downloadURL === ""
                            }
                        >
                            {t("ok", { ns: "common" })}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={this.state.remoteDownloadPathSelect}
                    onClose={this.onClose}
                    aria-labelledby="form-dialog-title"
                >
                    <DialogTitle id="form-dialog-title">
                        {t("modals.remoteDownloadDst")}
                    </DialogTitle>
                    <PathSelector
                        presentPath={this.props.path}
                        selected={this.props.selected}
                        onSelect={this.setMoveTarget}
                    />

                    {this.state.selectedPath !== "" && (
                        <DialogContent className={classes.contentFix}>
                            <DialogContentText>
                                <Trans
                                    i18nKey="modals.downloadTo"
                                    values={{
                                        name: this.state.selectedPathName,
                                    }}
                                    components={[<strong key={0} />]}
                                />
                            </DialogContentText>
                        </DialogContent>
                    )}
                    <DialogActions>
                        <Button onClick={this.onClose}>
                            {t("cancel", { ns: "common" })}
                        </Button>
                        <div className={classes.wrapper}>
                            <Button
                                onClick={this.submitDownload}
                                color="primary"
                                disabled={
                                    this.state.selectedPath === "" ||
                                    this.props.modalsLoading
                                }
                            >
                                {t("modals.createTask")}
                                {this.props.modalsLoading && (
                                    <CircularProgress
                                        size={24}
                                        className={classes.buttonProgress}
                                    />
                                )}
                            </Button>
                        </div>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={this.props.modalsStatus.torrentDownload}
                    onClose={this.onClose}
                    aria-labelledby="form-dialog-title"
                >
                    <DialogTitle id="form-dialog-title">
                        {t("modals.remoteDownloadDst")}
                    </DialogTitle>
                    <PathSelector
                        presentPath={this.props.path}
                        selected={this.props.selected}
                        onSelect={this.setMoveTarget}
                    />

                    {this.state.selectedPath !== "" && (
                        <DialogContent className={classes.contentFix}>
                            <DialogContentText>
                                <Trans
                                    i18nKey="modals.downloadTo"
                                    values={{
                                        name: this.state.selectedPathName,
                                    }}
                                    components={[<strong key={0} />]}
                                />
                            </DialogContentText>
                        </DialogContent>
                    )}
                    <DialogActions>
                        <Button onClick={this.onClose}>
                            {t("cancel", { ns: "common" })}
                        </Button>
                        <div className={classes.wrapper}>
                            <Button
                                onClick={this.submitTorrentDownload}
                                color="primary"
                                disabled={
                                    this.state.selectedPath === "" ||
                                    this.props.modalsLoading
                                }
                            >
                                {t("modals.createTask")}
                                {this.props.modalsLoading && (
                                    <CircularProgress
                                        size={24}
                                        className={classes.buttonProgress}
                                    />
                                )}
                            </Button>
                        </div>
                    </DialogActions>
                </Dialog>

                <DecompressDialog
                    open={this.props.modalsStatus.decompress}
                    onClose={this.onClose}
                    presentPath={this.props.path}
                    selected={this.props.selected}
                    modalsLoading={this.props.modalsLoading}
                />
                <CompressDialog
                    open={this.props.modalsStatus.compress}
                    onClose={this.onClose}
                    presentPath={this.props.path}
                    selected={this.props.selected}
                    modalsLoading={this.props.modalsLoading}
                />
                <DirectoryDownloadDialog
                    open={this.props.modalsStatus.directoryDownloading}
                    onClose={this.onClose}
                    done={this.props.modalsStatus.directoryDownloadDone}
                    log={this.props.modalsStatus.directoryDownloadLog}
                />
            </div>
        );
    }
}

ModalsCompoment.propTypes = {
    classes: PropTypes.object.isRequired,
};

const Modals = connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(withRouter(withTranslation()(ModalsCompoment))));

export default Modals;
