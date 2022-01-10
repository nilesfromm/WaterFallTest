class modelLoader{

    //--------------------------------------------------------------------------
    constructor(){
        this.scene = _G.MYSCENE.scene;
        this.gltf_loader = new THREE.GLTFLoader();
        this.waterMap;

        this.waterSettings = {
            speed: 70, //0 - 100
        }

        this.setupWaterGui();
        this.addModel();
    }

    //--------------------------------------------------------------------------
    addModel(){

        let path = 'models/waterfall_v4/waterfall_v4.gltf';
        this.gltf_loader.load(path, (gltf) => {
            this.model = gltf.scene;
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.frustumCulled = false;
                    child.castShadow = true;
                    child.receiveShadow = false;
                    // child.material.flatShading = false;
                    if(child.name === 'rock'){
                        child.material.metalness = 0.15;
                        child.material.roughness = 0.85;
                    }
                    else if(child.name === 'waterfall'){
                        child.material.metalness = 0.65;
                        child.material.roughness = 0.55;

                        this.waterMap = child.material;
                        console.log(this.waterMap);
                        let set = {
                            color: child.material.color.getHex(),
                        }
                        this.setupMatGui(set, child.material);
                    }
                }
            });

            let s = 1;
            this.model.scale.set(s, s, s);
            this.model.position.x = 0;
            this.model.position.y = 0;
            this.model.position.z = 0;
            this.scene.add(this.model);
            // this.model.visible = false;
            console.log("model loaded");
            
        });
    };

    //--------------------------------------------------------------------------
    update(_time){
        if(this.waterMap){
            this.waterMap.map.offset.x = -_time/(24*(110-this.waterSettings.speed));  //10 - 110
            // this.waterMap.map.offset.y = -_time/(24*(500));
        }
        // console.log(_time);
    }

    //--------------------------------------------------------------------------
    setupWaterGui(){
        let gui_temp = _G.DATGUI.addFolder("WATER");
        gui_temp.add( this.waterSettings, 'speed', 0, 100, 1 );
    }

    //--------------------------------------------------------------------------
    setupMatGui(set, mat){
        let gui_temp = _G.MYSCENE.gui_material.addFolder(mat.name);
        gui_temp.addColor( set, 'color' ).onChange(()=>{
            // colorValue=colorValue.replace( '#','0x' );
            mat.color.set( set.color );
        });
        gui_temp.add( mat, 'roughness', 0.0, 1.0, 0.01 );
        gui_temp.add( mat, 'metalness', 0.0, 1.0, 0.01 );
    }

}