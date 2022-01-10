$(document).ready(()=>{

    _G.DATGUI = new dat.GUI({ autoPlace: false, width:300 }); 
    var customContainer = document.getElementById( "mygui" );
    customContainer.appendChild(_G.DATGUI.domElement);
    _G.DATGUI.close();

    _G.MYINTERACT2D = new Interact2D();
    _G.MYINTERACT3D = new Interact3D();
    _G.MYLOADER = new Loader();
    _G.MYSCENE = new Scene();
    _G.MYMODEL = new modelLoader();

});