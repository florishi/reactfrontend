const statusHelper = {

    isHomePage(path){
        return path == "/home"
    },
    isSharePage(path){
        return path && path.startsWith("/s/")
    },
    isMobile(){
        return window.innerWidth < 600;
    },
}
export default statusHelper