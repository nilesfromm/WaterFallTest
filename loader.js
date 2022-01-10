class Loader{

    //--------------------------------------------------------------------------
    constructor(){

        this.gltf_loader = new THREE.GLTFLoader();
        this.model;
        //this.path = 'models/gltf/cradenza/cradenza.gltf';
        this.matSettings = [];
        this.materials = [];
        this.colorVar;
        this.vari = [];
    }


    //--------------------------------------------------------------------------
    // updateMaterials(){
    //     // this.matDoor.roughness = this.matSettings.Door.rough;
	// 	// this.matDoor.metalness = this.matSettings.Door.metal;
    //     // this.matBrass.roughness = this.matSettings.Brass.rough;
	// 	// this.matBrass.metalness = this.matSettings.Brass.metal;
    //     // this.matWalnut.roughness = this.matSettings.Walnut.rough;
	// 	// this.matWalnut.metalness = this.matSettings.Walnut.metal;
    // }

    //--------------------------------------------------------------------------
    load(_path){
        this.gltf_loader.load( _path, ( gltf ) => {
            this.model = gltf.scene;
            this.model.traverse( ( child ) => {

                if ( child.isMesh ) {
                    child.frustumCulled = false;
                    child.castShadow = true;
                    child.receiveShadow = false;
                    if(!this.materials.includes(child.material)){
                        this.materials.push(child.material);
                        this.matSettings.push({
                            name:                   child.material.name,
                            color:                  '#ffffff', //'#ffae23' 
                            rough:                  child.material.roughness,
                            metal:                  child.material.metalness,
                        });
                        if(child.material.name.includes("darkmetal")){
                            this.colorVar = child.material;
                            child.material.color.setHex( "0x222222" )
                            // child.material.metalnessMap = null;
                        }
                    }
                    
                    //child.material.flatShading = false;
                    if (child.name.includes("var")){
                        this.vari.push(child);
                        if (child.name.includes("1")){
                            child.visible = true;
                        }
                        else{
                            child.visible = false;
                        }
                    }
                }
            } );
            this.materials.forEach((m,i)=>{
                this.setupGui(this.matSettings[i], this.materials[i]);
            })

            let s = 1;
            this.model.scale.set(s,s,s);
            this.model.position.x = 0;
            this.model.position.y = 0;
            this.model.position.z = 0;
            //this.model.rotation.y = Math.PI;
            _G.MYSCENE.scene.add( this.model );
        });
    }

    //--------------------------------------------------------------------------
    setupGui(set,mat){
        let gui_temp = _G.MYSCENE.gui_material.addFolder(mat.name);
        gui_temp.addColor( set, 'color' ).onChange(( colorValue )=>{
            colorValue=colorValue.replace( '#','0x' );
            mat.color.setHex( colorValue );
        });
        gui_temp.add( mat, 'roughness', 0.0, 1.0, 0.01 );
        gui_temp.add( mat, 'metalness', 0.0, 1.0, 0.01 );
    }
    //--------------------------------------------------------------------------
    get_file_from_uid(_uid){

        //returns file

    }

    //--------------------------------------------------------------------------
    handle_mesh(_uid,_mesh,_parent,_cb){

        //traverse, settings
        _mesh.traverse(( child ) => {
            if ( child instanceof THREE.Mesh ) {
                child.frustumCulled = false;
                child.castShadow = true; 
                child.receiveShadow = false; 
            }
        });

        //scale
        var s = 1.0;
        _mesh.scale.set(s,s,s);

        //add
        _G.MYSCENE.scene.add( _mesh );

        _cb(); 

    }

    //--------------------------------------------------------------------------
    setup_datgui(){

    }

}