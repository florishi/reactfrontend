import {
    CircularProgress,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@material-ui/core";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import classNames from "classnames";
import React, { useCallback, useEffect, useMemo } from "react";
import { configure, GlobalHotKeys } from "react-hotkeys";
import explorer, { changeContextMenu, openRemoveDialog, setSelectedTarget } from "../../redux/explorer";
import { isMac } from "../../utils";
import pathHelper from "../../utils/page";
import ContextMenu from "./ContextMenu";
import ImgPreivew from "./ImgPreview";
import ObjectIcon from "./ObjectIcon";
import Nothing from "../Placeholder/Nothing";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { usePagination } from "../../hooks/pagination";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    paper: {
        padding: theme.spacing(2),
        textAlign: "center",
        color: theme.palette.text.secondary,
        margin: "10px",
    },
    root: {
        flexGrow: 1,
        padding: "10px",
    },
    rootTable: {
        padding: "0px",
        backgroundColor: theme.palette.background.paper.white,
    },
    typeHeader: {
        margin: "10px 25px",
        color: "#6b6b6b",
        fontWeight: "500",
    },
    loading: {
        justifyContent: "center",
        display: "flex",
        marginTop: "40px",
    },
    errorBox: {
        padding: theme.spacing(4),
    },
    errorMsg: {
        marginTop: "10px",
    },
    hideAuto: {
        [theme.breakpoints.down("sm")]: {
            display: "none",
        },
    },
    flexFix: {
        minWidth: 0,
    },
    upButton: {
        marginLeft: "20px",
        marginTop: "10px",
        marginBottom: "10px",
    },
    clickAway: {
        height: "100%",
        width: "100%",
    },
    rootShare: {},
    visuallyHidden: {
        border: 0,
        clip: "rect(0 0 0 0)",
        height: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        top: 20,
        width: 1,
    },
    gridContainer: {
        [theme.breakpoints.down("sm")]: {
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
        },
        [theme.breakpoints.up("md")]: {
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
        },
        display: "grid",
    },
    gridItem: {
        flex: "1 1 220px",
    },
}));

const keyMap = {
    DELETE_FILE: "del",
    SELECT_ALL_SHOWED: `${isMac() ? "command" : "ctrl"}+a`,
    SELECT_ALL: `${isMac() ? "command" : "ctrl"}+shift+a`,
    DESELECT_ALL: "esc",
};

export default function Explorer({ share }) {
    const location = useLocation();
    const dispatch = useDispatch();
    const selected = useSelector((state) => state.explorer.selected);
    const keywords = useSelector((state) => state.explorer.keywords);
    const loading = useSelector((state) => state.viewUpdate.navigatorLoading);
    const path = useSelector((state) => state.navigator.path);
    const sortMethod = useSelector((state) => state.viewUpdate.sortMethod);
    const navigatorErrorMsg = useSelector(
        (state) => state.viewUpdate.navigatorErrorMsg
    );
    const navigatorError = useSelector(
        (state) => state.viewUpdate.navigatorError
    );
    const viewMethod = useSelector(
        (state) => state.viewUpdate.explorerViewMethod
    );

    const OpenRemoveDialog = useCallback(() => dispatch(openRemoveDialog()), [
        dispatch,
    ]);
    const SetSelectedTarget = useCallback(
        (targets) => dispatch(setSelectedTarget(targets)),
        [dispatch]
    );
    const ChangeContextMenu = useCallback(
        (type, open) => dispatch(changeContextMenu(type, open)),
        [dispatch]
    );
    const ChangeSortMethod = useCallback(
        (method) => dispatch(explorer.actions.changeSortMethod(method)),
        [dispatch]
    );
    const SelectAll = useCallback(
        () => dispatch(explorer.actions.selectAll()),
        [dispatch]
    );

    const { dirList, fileList } = usePagination();

    const handlers = {
        DELETE_FILE: () => {
            if (selected.length > 0 && !share) {
                OpenRemoveDialog();
            }
        },
        SELECT_ALL_SHOWED: (e) => {
            e.preventDefault();
            if (selected.length >= dirList.length + fileList.length) {
                SetSelectedTarget([]);
            } else {
                SetSelectedTarget([...dirList, ...fileList]);
            }
        },
        SELECT_ALL: (e) => {
            e.preventDefault();
            SelectAll();
        },
        DESELECT_ALL: (e) => {
            e.preventDefault();
            SetSelectedTarget([]);
        },
    };

    useEffect(
        () =>
            configure({
                ignoreTags: ["input", "select", "textarea"],
            }),
        []
    );

    const contextMenu = (e) => {
        e.preventDefault();
        if (keywords === "" && !pathHelper.isSharePage(location.pathname)) {
            if (!loading) {
                ChangeContextMenu("empty", true);
            }
        }
    };

    const ClickAway = (e) => {
        const element = e.target;
        if (element.dataset.clickaway) {
            SetSelectedTarget([]);
        }
    };

    const classes = useStyles();
    const isHomePage = pathHelper.isHomePage(location.pathname);

    const showView =
        !loading && (dirList.length !== 0 || fileList.length !== 0);

    const listView = useMemo(
        () => (
            <Table className={classes.table}>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <TableSortLabel
                                active={
                                    sortMethod === "namePos" ||
                                    sortMethod === "nameRev"
                                }
                                direction={
                                    sortMethod === "namePos" ? "asc" : "des"
                                }
                                onClick={() => {
                                    ChangeSortMethod(
                                        sortMethod === "namePos"
                                            ? "nameRev"
                                            : "namePos"
                                    );
                                }}
                            >
                                名称
                                {sortMethod === "namePos" ||
                                sortMethod === "nameRev" ? (
                                    <span className={classes.visuallyHidden}>
                                        {sortMethod === "nameRev"
                                            ? "sorted descending"
                                            : "sorted ascending"}
                                    </span>
                                ) : null}
                            </TableSortLabel>
                        </TableCell>
                        <TableCell className={classes.hideAuto}>
                            <TableSortLabel
                                active={
                                    sortMethod === "sizePos" ||
                                    sortMethod === "sizeRes"
                                }
                                direction={
                                    sortMethod === "sizePos" ? "asc" : "des"
                                }
                                onClick={() => {
                                    ChangeSortMethod(
                                        sortMethod === "sizePos"
                                            ? "sizeRes"
                                            : "sizePos"
                                    );
                                }}
                            >
                                大小
                                {sortMethod === "sizePos" ||
                                sortMethod === "sizeRes" ? (
                                    <span className={classes.visuallyHidden}>
                                        {sortMethod === "sizeRes"
                                            ? "sorted descending"
                                            : "sorted ascending"}
                                    </span>
                                ) : null}
                            </TableSortLabel>
                        </TableCell>
                        <TableCell className={classes.hideAuto}>
                            <TableSortLabel
                                active={
                                    sortMethod === "modifyTimePos" ||
                                    sortMethod === "modifyTimeRev"
                                }
                                direction={
                                    sortMethod === "modifyTimePos"
                                        ? "asc"
                                        : "des"
                                }
                                onClick={() => {
                                    ChangeSortMethod(
                                        sortMethod === "modifyTimePos"
                                            ? "modifyTimeRev"
                                            : "modifyTimePos"
                                    );
                                }}
                            >
                                修改日期
                                {sortMethod === "modifyTimePos" ||
                                sortMethod === "modifyTimeRev" ? (
                                    <span className={classes.visuallyHidden}>
                                        {sortMethod === "sizeRes"
                                            ? "sorted descending"
                                            : "sorted ascending"}
                                    </span>
                                ) : null}
                            </TableSortLabel>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pathHelper.isMobile() && path !== "/" && (
                        <ObjectIcon
                            file={{
                                type: "up",
                                name: "上级目录",
                            }}
                        />
                    )}
                    {dirList.map((value, index) => (
                        <ObjectIcon key={value.id} file={value} index={index} />
                    ))}
                    {fileList.map((value, index) => (
                        <ObjectIcon key={value.id} file={value} index={index} />
                    ))}
                </TableBody>
            </Table>
        ),
        [dirList, fileList, path, sortMethod, ChangeSortMethod]
    );

    const normalView = useMemo(
        () => (
            <div className={classes.flexFix}>
                {dirList.length !== 0 && (
                    <>
                        <Typography
                            data-clickAway={"true"}
                            variant="body2"
                            className={classes.typeHeader}
                        >
                            文件夹
                        </Typography>
                        <Grid
                            data-clickAway={"true"}
                            container
                            spacing={0}
                            alignItems="flex-start"
                            className={classes.gridContainer}
                        >
                            {dirList.map((value, index) => (
                                <Grid
                                    key={value.id}
                                    item
                                    className={classes.gridItem}
                                >
                                    <ObjectIcon
                                        key={value.id}
                                        file={value}
                                        index={index}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
                {fileList.length !== 0 && (
                    <>
                        <Typography
                            data-clickAway={"true"}
                            variant="body2"
                            className={classes.typeHeader}
                        >
                            文件
                        </Typography>
                        <Grid
                            data-clickAway={"true"}
                            container
                            spacing={0}
                            alignItems="flex-start"
                            className={classes.gridContainer}
                        >
                            {fileList.map((value, index) => (
                                <Grid
                                    className={classes.gridItem}
                                    key={value.id}
                                    item
                                >
                                    <ObjectIcon
                                        key={value.id}
                                        index={index}
                                        file={value}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </div>
        ),
        [dirList, fileList]
    );

    const view = viewMethod === "list" ? listView : normalView;

    return (
        <div
            onContextMenu={contextMenu}
            onClick={ClickAway}
            className={classNames(
                {
                    [classes.root]: viewMethod !== "list",
                    [classes.rootTable]: viewMethod === "list",
                },
                classes.button
            )}
        >
            <GlobalHotKeys handlers={handlers} allowChanges keyMap={keyMap} />
            <ContextMenu share={share} />
            <ImgPreivew />
            {navigatorError && (
                <Paper elevation={1} className={classes.errorBox}>
                    <Typography variant="h5" component="h3">
                        :( 请求时出现错误
                    </Typography>
                    <Typography
                        color={"textSecondary"}
                        className={classes.errorMsg}
                    >
                        {navigatorErrorMsg.message}
                    </Typography>
                </Paper>
            )}

            {loading && !navigatorError && (
                <div className={classes.loading}>
                    <CircularProgress />
                </div>
            )}

            {keywords === "" &&
                isHomePage &&
                dirList.length === 0 &&
                fileList.length === 0 &&
                !loading &&
                !navigatorError && (
                    <Nothing
                        primary={"拖拽文件至此"}
                        secondary={"或点击右下方“上传文件”按钮添加文件"}
                    />
                )}
            {((keywords !== "" &&
                dirList.length === 0 &&
                fileList.length === 0 &&
                !loading &&
                !navigatorError) ||
                (dirList.length === 0 &&
                    fileList.length === 0 &&
                    !loading &&
                    !navigatorError &&
                    !isHomePage)) && <Nothing primary={"什么都没有找到"} />}
            {showView && view}
        </div>
    );
}
