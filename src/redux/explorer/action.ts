import { AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { CloudreveFile, SortMethod } from "./../../types/index";
import { closeContextMenu } from "../viewUpdate/action";
import { Policy } from "../../component/Uploader/core/types";
import streamSaver from "streamsaver";
import "../../utils/zip";
import pathHelper from "../../utils/page";
import { isMac } from "../../utils";
import { getBaseURL } from "../../middleware/Api";
import { pathJoin, trimPrefix } from "../../component/Uploader/core/utils";
import { getPreviewPath, walk } from "../../utils/api";
import Auth from "../../middleware/Auth";
import { isPreviewable } from "../../config";
import { push } from "connected-react-router";
import {
    changeContextMenu,
    closeAllModals,
    openLoadingDialog,
    showAudioPreview,
    showImgPreivew,
    toggleSnackbar,
} from "./index";

export interface ActionSetFileList extends AnyAction {
    type: "SET_FILE_LIST";
    list: CloudreveFile[];
}
export const setFileList = (list: CloudreveFile[]): ActionSetFileList => {
    return {
        type: "SET_FILE_LIST",
        list,
    };
};

export interface ActionSetDirList extends AnyAction {
    type: "SET_DIR_LIST";
    list: CloudreveFile[];
}
export const setDirList = (list: CloudreveFile[]): ActionSetDirList => {
    return {
        type: "SET_DIR_LIST",
        list,
    };
};

export interface ActionSetSortMethod extends AnyAction {
    type: "SET_SORT_METHOD";
    method: SortMethod;
}
export const setSortMethod = (method: SortMethod): ActionSetSortMethod => {
    return {
        type: "SET_SORT_METHOD",
        method,
    };
};

export const setSideBar = (open: boolean) => {
    return {
        type: "SET_SIDE_BAR",
        open,
    };
};

export const setCurrentPolicy = (policy: Policy) => {
    return {
        type: "SET_CURRENT_POLICY",
        policy,
    };
};

export const removeSelectedTargets = (fileIds: any) => {
    return {
        type: "RMOVE_SELECTED_TARGETS",
        fileIds,
    };
};
export const addSelectedTargets = (targets: any) => {
    return {
        type: "ADD_SELECTED_TARGETS",
        targets,
    };
};
export const setSelectedTarget = (targets: any) => {
    return {
        type: "SET_SELECTED_TARGET",
        targets,
    };
};
export const setLastSelect = (file: any, index: any) => {
    return {
        type: "SET_LAST_SELECT",
        file,
        index,
    };
};
export const setShiftSelectedIds = (shiftSelectedIds: any) => {
    return {
        type: "SET_SHIFT_SELECTED_IDS",
        shiftSelectedIds,
    };
};

type SortFunc = (a: CloudreveFile, b: CloudreveFile) => number;
const sortMethodFuncs: Record<SortMethod, SortFunc> = {
    sizePos: (a: CloudreveFile, b: CloudreveFile) => {
        return a.size - b.size;
    },
    sizeRes: (a: CloudreveFile, b: CloudreveFile) => {
        return b.size - a.size;
    },
    namePos: (a: CloudreveFile, b: CloudreveFile) => {
        return a.name.localeCompare(
            b.name,
            navigator.languages[0] || navigator.language,
            { numeric: true, ignorePunctuation: true }
        );
    },
    nameRev: (a: CloudreveFile, b: CloudreveFile) => {
        return b.name.localeCompare(
            a.name,
            navigator.languages[0] || navigator.language,
            { numeric: true, ignorePunctuation: true }
        );
    },
    timePos: (a: CloudreveFile, b: CloudreveFile) => {
        return Date.parse(a.date) - Date.parse(b.date);
    },
    timeRev: (a: CloudreveFile, b: CloudreveFile) => {
        return Date.parse(b.date) - Date.parse(a.date);
    },
};

export const updateFileList = (
    list: CloudreveFile[]
): ThunkAction<any, any, any, any> => {
    return (dispatch, getState): void => {
        const state = getState();
        // TODO: define state type
        const { sortMethod } = state.viewUpdate;
        const dirList = list.filter((x) => {
            return x.type === "dir";
        });
        const fileList = list.filter((x) => {
            return x.type === "file";
        });
        const sortFunc = sortMethodFuncs[sortMethod as SortMethod];
        dispatch(setDirList(dirList.sort(sortFunc)));
        dispatch(setFileList(fileList.sort(sortFunc)));
    };
};

export const changeSortMethod = (
    method: SortMethod
): ThunkAction<any, any, any, any> => {
    return (dispatch, getState): void => {
        const state = getState();
        const { fileList, dirList } = state.explorer;
        const sortFunc = sortMethodFuncs[method];
        dispatch(setSortMethod(method));
        dispatch(setDirList(dirList.sort(sortFunc)));
        dispatch(setFileList(fileList.sort(sortFunc)));
    };
};

export const toggleObjectInfoSidebar = (
    open: boolean
): ThunkAction<any, any, any, any> => {
    return (dispatch, getState): void => {
        const state = getState();
        if (open) {
            dispatch(closeContextMenu());
        }
        dispatch(setSideBar(true));
    };
};

export const startBatchDownload = (
    share: any
): ThunkAction<any, any, any, any> => {
    return async (dispatch, getState): Promise<void> => {
        dispatch(changeContextMenu("file", false));
        const {
            explorer: { selected },
        } = getState();

        dispatch(openLoadingDialog("列取文件中..."));

        let queue: CloudreveFile[] = [];
        try {
            queue = await walk(selected, share);
        } catch (e) {
            dispatch(
                toggleSnackbar(
                    "top",
                    "right",
                    `列取文件时出错：${e.message}`,
                    "warning"
                )
            );
            dispatch(closeAllModals());
            return;
        }

        dispatch(closeAllModals());
        dispatch(
            toggleSnackbar(
                "top",
                "center",
                `打包下载已开始，请不要关闭此标签页`,
                "info"
            )
        );
        const fileStream = streamSaver.createWriteStream("archive.zip");
        let failed = 0;
        const readableZipStream = new (window as any).ZIP({
            start(ctrl: any) {
                // ctrl.close()
            },
            async pull(ctrl: any) {
                while (queue.length > 0) {
                    const next = queue.pop();
                    if (next && next.type === "file") {
                        const previewPath = getPreviewPath(next);
                        const url =
                            getBaseURL() +
                            (pathHelper.isSharePage(location.pathname)
                                ? "/share/preview/" +
                                  next.id +
                                  (previewPath !== ""
                                      ? "?path=" + previewPath
                                      : "")
                                : "/file/preview/" + next.id);
                        try {
                            const res = await fetch(url, { cache: "no-cache" });
                            const stream = () => res.body;
                            const name = trimPrefix(
                                pathJoin([next.path, next.name]),
                                "/"
                            );
                            ctrl.enqueue({ name, stream });
                            return;
                        } catch (e) {
                            failed++;
                        }
                    }
                }
                ctrl.close();
            },
        });

        // more optimized
        if (window.WritableStream && readableZipStream.pipeTo) {
            return readableZipStream
                .pipeTo(fileStream)
                .then(() => dispatch(closeAllModals()))
                .catch((e) => {
                    console.log(e);
                    toggleSnackbar(
                        "top",
                        "right",
                        `打包遇到错误：${e.message}`,
                        "warning"
                    );
                    dispatch(closeAllModals());
                });
        }
    };
};

export const openPreview = () => {
    return (dispatch: any, getState: any) => {
        const {
            explorer: { selected },
            router: {
                location: { pathname },
            },
        } = getState();
        const isShare = pathHelper.isSharePage(pathname);
        if (isShare) {
            const user = Auth.GetUser();
            if (!Auth.Check() && user && !user.group.shareDownload) {
                dispatch(toggleSnackbar("top", "right", "请先登录", "warning"));
                dispatch(changeContextMenu("file", false));
                return;
            }
        }

        dispatch(changeContextMenu("file", false));
        const previewPath = getPreviewPath(selected[0]);
        switch (isPreviewable(selected[0].name)) {
            case "img":
                dispatch(showImgPreivew(selected[0]));
                return;
            case "msDoc":
                if (isShare) {
                    dispatch(
                        push(
                            selected[0].key +
                                "/doc?name=" +
                                encodeURIComponent(selected[0].name) +
                                "&share_path=" +
                                previewPath
                        )
                    );
                    return;
                }
                dispatch(
                    push("/doc?p=" + previewPath + "&id=" + selected[0].id)
                );
                return;
            case "audio":
                //if (isShare) {
                //    dispatch(openMusicDialog());
                //}else{
                dispatch(showAudioPreview(selected[0]));
                //}
                return;
            case "video":
                if (isShare) {
                    dispatch(
                        push(
                            selected[0].key +
                                "/video?name=" +
                                encodeURIComponent(selected[0].name) +
                                "&share_path=" +
                                previewPath
                        )
                    );
                    return;
                }
                dispatch(
                    push("/video?p=" + previewPath + "&id=" + selected[0].id)
                );
                return;
            case "pdf":
                if (isShare) {
                    dispatch(
                        push(
                            selected[0].key +
                                "/pdf?name=" +
                                encodeURIComponent(selected[0].name) +
                                "&share_path=" +
                                previewPath
                        )
                    );
                    return;
                }
                dispatch(
                    push("/pdf?p=" + previewPath + "&id=" + selected[0].id)
                );
                return;
            case "edit":
                if (isShare) {
                    dispatch(
                        push(
                            selected[0].key +
                                "/text?name=" +
                                encodeURIComponent(selected[0].name) +
                                "&share_path=" +
                                previewPath
                        )
                    );
                    return;
                }
                dispatch(
                    push("/text?p=" + previewPath + "&id=" + selected[0].id)
                );
                return;
            case "code":
                if (isShare) {
                    dispatch(
                        push(
                            selected[0].key +
                                "/code?name=" +
                                encodeURIComponent(selected[0].name) +
                                "&share_path=" +
                                previewPath
                        )
                    );
                    return;
                }
                dispatch(
                    push("/code?p=" + previewPath + "&id=" + selected[0].id)
                );
                return;
            default:
                dispatch(openLoadingDialog("获取下载地址..."));
                return;
        }
    };
};
export const selectFile = (file: any, event: any, fileIndex: any) => {
    const { ctrlKey, metaKey, shiftKey } = event;
    return (dispatch: any, getState: any) => {
        // 多种组合操作忽略
        if ([ctrlKey, metaKey, shiftKey].filter(Boolean).length > 1) {
            return;
        }
        const isMacbook = isMac();
        const { explorer } = getState();
        const {
            selected,
            lastSelect,
            dirList,
            fileList,
            shiftSelectedIds,
        } = explorer;
        if (
            shiftKey &&
            !ctrlKey &&
            !metaKey &&
            selected.length !== 0 &&
            // 点击类型一样
            file.type === lastSelect.file.type
        ) {
            // shift 多选
            // 取消原有选择
            dispatch(removeSelectedTargets(selected.map((v: any) => v.id)));
            // 添加新选择
            const begin = Math.min(lastSelect.index, fileIndex);
            const end = Math.max(lastSelect.index, fileIndex);
            const list = file.type === "dir" ? dirList : fileList;
            const newShiftSelected = list.slice(begin, end + 1);
            return dispatch(addSelectedTargets(newShiftSelected));
        }
        dispatch(setLastSelect(file, fileIndex));
        dispatch(setShiftSelectedIds([]));
        if ((ctrlKey && !isMacbook) || (metaKey && isMacbook)) {
            // Ctrl/Command 单击添加/删除
            const presentIndex = selected.findIndex((value: any) => {
                return value.id === file.id;
            });
            if (presentIndex !== -1) {
                return dispatch(removeSelectedTargets([file.id]));
            }
            return dispatch(addSelectedTargets([file]));
        }
        // 单选
        return dispatch(setSelectedTarget([file]));
    };
};
