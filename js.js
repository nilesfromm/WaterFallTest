//alert("Dev Version 003");

import * as THREE from '/lib/r125/build/three.module.js';
import { ARButton } from '/lib/r125/examples/jsm/webxr/ARButton_custom.js';
//import { OrbitControls } from '/lib/r125/examples/jsm/controls/OrbitControls.js';
import { ColladaLoader } from '/lib/r125/examples/jsm/loaders/ColladaLoader.js';
import { GLTFLoader } from '/lib/r125/examples/jsm/loaders/GLTFLoader.js';


var _G = { 

    //-----------------------------------------------------------------------------------------------
    // SETTINGS (EDIT THESE)
    COUNT:                          3,                                      // 1,2,3,4 (max is 4)
    TEXT3D_ENABLED:                 true,                                   // false to disable 3d text 
    BRAND_TEXT:                     "PARARTY.COM &nbsp; #PARARTY",                           // large text that appears
    DEBUG:                          false,                                   // if true #log will show
    RUN_COMPATIBLE_TESTS:           true,                                  // check if device supports webXR. keep false on desktop testing.
    FORMAT:                         "dae",                                  // dae, gltf, hcap
    THUMB_TYPE:                     "gif",                                  // gif or png
    FIRST_LOAD_UID:                 "bobbytechnoelf",                                     // first loaded uid, see ar.php data-firstUid, (models/format/uid/move.format)
    FIRST_LOAD_MOVE:                "arms",                                     // first loaded move, see ar.php data-firstMove, (models/format/uid/move.format)

    //-----------------------------------------------------------------------------------------------
    // VARS
    MYTHREE:                        undefined,                              //instance of class-three
    MYMODEL:                        undefined,                              //instance of class-model
    MYAUDIO:                        undefined,                              //instance of class-audio
    MYTEXT:                         undefined,                              //instance of class-text
    DATGUI:                         undefined,                              //instance of dat gui
    AINDEX:                         0,                                      //active index
    SHADOWS_ON:                     true,                                   //lets keep on
    TARGET_ACTIVE:                  true,                                   //toggle with target-ui
    TOUCH_ON_CANVAS:                false,                                  //true when we touch canvas, false when we touch ui
    UI_SEE:                         true,                                   //toggle with eye-ui
    LOADING:                        false,                                  //true when loading model
    TEXT3D_ACTIVE:                  false,                                  //true when 3D text is active
    MUTED:                          false,                                  //true when audio is muted
    TOUCH_TAP:                      false,
    UI_SEE_MODE:                    0, 
    HAMMER_INTERACTION:             false,
    FIRST_TAP_WAITING:              true,
    FIRST_TAP_WAIT_MS:              4000,
    GLOBAL_SCALE_ADJUST:            1.0,
    IS_IOS:                         false,
    
};


class ThreeJSforXR{

	//=================================================================================================
	constructor(){

		this.settings = {
			background_color: 				0x111111,
			shadow_opacity: 				0.75,
			shadow_size: 					1024,
			shadow_radius: 					2,
			ambient_light_intensity: 		0.05,
            hemisphere_light_intensity: 	0.9,
			point_light_intensity: 			0.5,
			point_light_height: 			15,
			point_light_color: 				0xffffff,
			point_light_x: 					-2,
			point_light_z: 					2,
			directional_light_intensity: 	0.4,
			directional_light_height: 		15,
			directional_light_color: 		0xffffff,
			directional_light_x: 			-2,
			directional_light_z: 			2,
			grid_y:							-0.03,
			grid_color: 					0x333333,
			shadowplane_y: 					0,
			shadowplane_opacity: 			0.25,
		};

		this.container; //our div this.container for the this.scene
		this.camera; //our this.camera
		this.scene; //our this.scene
		this.renderer; //our this.renderer
		this.controls; // our mouse this.controls
		this.floor; //our this.floor
		this.clock; //our this.clock for timing
		this.directionalLight;
		this.ambientlight; //our ambient light
		this.hemispherelight; //our hemispheric light
		this.shadowplane;
		this.shadowplanes = []; //we need a shadowplane for each model
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;

		this.setup_scene();
		this.setup_gui();

		this.last_matrix;

	}



	//=======================================================================================
	setup_scene(){

		//scene
		this.scene = new THREE.Scene();

		//camera
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 30 );
		this.scene.add( this.camera );

		//canvas container
		this.container = document.getElementById( 'mycanvas' );

		//renderer
        //this.renderer = new THREE.WebGLRenderer( { canvas:this.container, antialias:true, alpha:true } );
        this.renderer = new THREE.WebGLRenderer( { antialias:true, alpha:true } );
        this.renderer.xr.enabled = true;
		//this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setPixelRatio( 1 );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowIntensity = this.settings.shadow_opacity;
		this.renderer.shadowMap.enabled = _G.SHADOWS_ON;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // var container = document.createElement( 'div' );
        // document.body.appendChild( container );
        this.container.appendChild( this.renderer.domElement );

        //ar button w/ dom overlay
        dlog("before ARButton");
        //document.body.appendChild( ARButton.createButton( this.renderer ) );
		document.body.appendChild( ARButton.createButton( this.renderer, {
			requiredFeatures: [ 'hit-test' ],
			optionalFeatures: [ 'dom-overlay', 'dom-overlay-for-handheld-ar' ],
			domOverlay: { root: document.body } } )
        );
        dlog("after ARButton");

        //interact

		this.controller = this.renderer.xr.getController( 0 );
		
        this.controller.addEventListener( 'select', ()=>{

            dlog("tap");

			if(_G.FIRST_TAP_WAITING){return;}

            if ( _G.TOUCH_ON_CANVAS && _G.TARGET_ACTIVE && _G.UI_SEE && !_G.HAMMER_INTERACTION) {

				if(_G.TEXT3D_ACTIVE){
					_G.MYTEXT.update_mesh_location( this.target_ring.matrix );
				}else{
					_G.MYMODEL.update_mesh_location( this.target_ring.matrix );
					this.last_matrix = this.target_ring.matrix;
				}

			}
		});
		
        this.scene.add( this.controller );

		// this.clock
		this.clock = new THREE.Clock();

		//ambient light
		this.ambientlight = new THREE.AmbientLight( 0xffffff, this.settings.ambient_light_intensity ); 
		//this.scene.add( this.ambientlight ); 
		
		//hemisphere light
		this.hemispherelight = new THREE.HemisphereLight(0xdddddd, 0x888888, this.settings.hemisphere_light_intensity );
		this.hemispherelight.position.set(0, 25, 0);
		//this.scene.add( this.hemispherelight ); 

		//directional light
		this.directionalLight = new THREE.DirectionalLight();
		this.directionalLight.intensity = this.settings.directional_light_intensity;
		this.directionalLight.position.set(this.settings.directional_light_x, this.settings.directional_light_height, this.settings.directional_light_z);
		this.directionalLight.castShadow = true;
		this.directionalLight.shadow.camera.zoom = 2.0; //wtf does this do
		this.directionalLight.shadow.mapSize.width = this.settings.shadow_size;
		this.directionalLight.shadow.mapSize.height = this.settings.shadow_size;
		this.directionalLight.shadow.camera.near = 0.1; 
		this.directionalLight.shadow.camera.far = 200; 
		this.directionalLight.shadow.camera.fov = 30; 
		//this.scene.add(this.directionalLight);

		//point light
		// this.pointLight = new THREE.PointLight();
		// this.pointLight.intensity = this.settings.point_light_intensity;
		// this.pointLight.position.set(this.settings.point_light_x, this.settings.point_light_height, this.settings.point_light_z);
		// this.pointLight.castShadow = true;
		// this.pointLight.shadow.camera.zoom = 2.0; //wtf does this do
		// this.pointLight.shadow.mapSize.width = this.settings.shadow_size;
		// this.pointLight.shadow.mapSize.height = this.settings.shadow_size;
		// this.pointLight.shadow.camera.near = 0.1; 
		// this.pointLight.shadow.camera.far = 200; 
		// this.pointLight.shadow.camera.fov = 30; 
        // this.scene.add(this.pointLight);
        
		//shadow plane
		var planeGeometry = new THREE.PlaneGeometry(300, 300);
		planeGeometry.rotateX(-Math.PI / 2);
		this.shadowplane = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({color:0x000000,opacity:this.settings.shadowplane_opacity}));
		this.shadowplane.receiveShadow = true;
		this.scene.add(this.shadowplane);
		this.shadowplane.visible = false;

		//responsive
		window.addEventListener( 'resize', ()=>{
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize( window.innerWidth, window.innerHeight );
		}, false );


	}

	//=======================================================================================
	set_size(_w,_h){
		this.camera.aspect = _w / _h;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( _w, _h );
	}


	//=======================================================================================
	render( timestamp, frame ){

		//touch to place model
        if ( frame ) {
            var referenceSpace = this.renderer.xr.getReferenceSpace();
			var session = this.renderer.xr.getSession();
            if ( this.hitTestSourceRequested === false ) {
                session.requestReferenceSpace( 'viewer' ).then(  ( referenceSpace ) => {
                    session.requestHitTestSource( { space: referenceSpace } ).then( ( source ) => {
                        this.hitTestSource = source;
                    } );
                } );
                session.addEventListener( 'end', () => {
                    this.hitTestSourceRequested = false;
                    this.hitTestSource = null;
                } );
                this.hitTestSourceRequested = true;
            }
            if ( this.hitTestSource  ) {

				var hitTestResults = frame.getHitTestResults( this.hitTestSource );
				
                if ( hitTestResults.length && _G.TOUCH_ON_CANVAS && _G.TARGET_ACTIVE ) {
					var hit = hitTestResults[ 0 ];
					if(_G.UI_SEE){
						this.target_ring.visible = true;
					}
                    this.target_ring.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
                } else {
					this.target_ring.visible = false;
				}

				if( hitTestResults.length && _G.TOUCH_ON_CANVAS && !_G.TARGET_ACTIVE && _G.TOUCH_TAP){
					overlay_msg('TARGET IS DISABLED',2000);
					_G.TOUCH_ON_CANVAS = false;
				}

			}
        }

		//update the loader
        _G.MYMODEL.update();

		//render
		this.renderer.render( this.scene, this.camera );

    }
    start(){
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }


	//=======================================================================================	
	setup_gui(){

		var f1 = _G.DATGUI.addFolder('Environment');

			f1.add(this.settings, 'hemisphere_light_intensity', 0.5, 1.25, 0.01).name("Hemisphere Light").onChange((val)=>{
				this.hemispherelight.intensity = val;
			});
			// f1.add(this.settings, 'ambient_light_intensity', 0, 1.0, 0.01).name("Ambient Light").onChange((val)=>{
			// 	this.ambientlight.intensity = val;
			// });
			f1.add(this.settings, 'directional_light_intensity', 0.0, 1.0, 0.01).name("Direct Light").onChange((val)=>{
				this.directionalLight.intensity = val;
			});
			f1.add(this.settings, 'directional_light_x', -5, 5, 0.01).name("Light X").onChange((val)=>{
				this.directionalLight.position.x = val;
			});
			f1.add(this.settings, 'directional_light_z', -5, 5, 0.01).name("Light Z").onChange((val)=>{
				this.directionalLight.position.z = val;
            });
			// f1.add(this.settings, 'point_light_intensity', 0.0, 1.0, 0.01).name("Point Light").onChange((val)=>{
			// 	this.pointLight.intensity = val;
			// });
			// f1.add(this.settings, 'point_light_x', -5, 5, 0.01).name("Light X").onChange((val)=>{
			// 	this.pointLight.position.x = val;
			// });
			// f1.add(this.settings, 'point_light_z', -5, 5, 0.01).name("Light Z").onChange((val)=>{
			// 	this.pointLight.position.z = val;
			// });
			f1.add(this.settings, 'shadowplane_opacity', 0.0, 0.60, 0.01).name("Shadow Strength").onChange((val)=>{ 
				this.shadowplane.material.opacity = val;
				if(val<=0){
					_G.MYTHREE.shadowplane.visible = false;
				}else{
					_G.MYTHREE.shadowplane.visible = true;
				}
			});
		
	}
	

}


class Model{

    //===========================================================================================================
    constructor(){

        this.collada_loader = new ColladaLoader();
        this.gltf_loader = new GLTFLoader();

        this.clock = new THREE.Clock();
        this.dt = 0;
        this.loading = false;
        this.first_placement = true;

        //the settings of the active model (used by dat-gui)
        this.active_settings = {

            y:                  0,
            x:                  0,
            z:                  0,

            scale:              0.35, 
            rotation:           0,
            speed:              1.0,

            vertical_shift:     0,
            head:               1.0,
            feet:               1.0,

            body_mosh:          0,
            neck_mosh:          0,
            arm_mosh:           0,
            mosh_speed:         2.5,

        };

        this.last_matrix = new THREE.Matrix4(); //last matrix of AR tap
        this.last_position = new THREE.Vector3(0,0,0); //last position of AR tap


        this.scale_change = false;
        this.mosh_counter = 0;

        this.models = [];
        this.populate_models_and_thumbs();

        this.assets = [];
        this.init_assets(()=>{

            this.populate_library();
            this.init_interactions();
            this.setup_gui();

            //DESKTOP DEBUG USE THIS
            // _G.MYMODEL.load_model(_G.FIRST_LOAD_UID,_G.FIRST_LOAD_MOVE,0,()=>{
            //     dlog("Loaded default model: "+_G.FIRST_LOAD_UID+"-"+_G.FIRST_LOAD_MOVE);
            // });

        });

        this.shadowplane_y = 99; //we put at lowest model!

    }

    //===========================================================================================================
    init_interactions(){

        //helpful debugging for webXR
        this.show_log_overlay = true;
        if(this.show_log_overlay){
            $(".log_overlay").show();
            window.onerror = function(error, url, line) {
                var err = "ERROR: "+error+" | line:"+line;
                $(".log_overlay").prepend(err+"<br>");
            };
        }

        //--------------------------------------------------------------------------------
        //select a model from thumb
        $(document).on('click','.model_row', function(e) {

            var uid = $(this).attr("data-uid");
            var move = $(this).attr("data-move");

            $("#models_container").hide();

            dlog("Loading model, "+uid+"-"+move);

            _G.MYMODEL.load_model( uid, move, _G.AINDEX, ()=>{
                dlog("Loaded model, "+uid+"-"+move);
            });

        });

        //--------------------------------------------------------------------------------
        //select model icon
        $("#ui_select_model").click(function(){

            if(_G.MYMODEL.loading){return;}

            if(_G.COUNT===1){

                _G.TEXT3D_ACTIVE = false;
                _G.MYMODEL.set_active_index(0);
                $("#models_container").show();

            }else{

                //let's check if there is actually free space for another model
                var free_space = false;
                for(var i=0;i<_G.COUNT;i++){
                    if(!_G.MYMODEL.models[i].mesh){
                        free_space = true;
                        _G.TEXT3D_ACTIVE = false;
                        _G.MYMODEL.set_active_index(i);
                        $("#models_container").show();
                        break;
                    }
                }
                if(!free_space){ overlay_msg("YOU'RE AT <u>MAX</u> DANCERS",2500); }

            }
                
        });
        $("#models_close").click(()=>{
            $("#models_container").hide();
            this.reset_active_index();
        });

        //--------------------------------------------------------------------------------
        //click thumb MODEL
        $(document).on('click','.athumb_model',function(){

            _G.MYMODEL.set_active_index( parseInt($(this).attr("data-index")) );

            _G.TEXT3D_ACTIVE = false;

            if(!_G.MYMODEL.models[_G.AINDEX].mesh){ //its empty so open models
                $("#models_container").show();
            }        

        });

        //--------------------------------------------------------------------------------
        //touch events pinch/drag for scale and rotate
        var mycvs = document.getElementById('mycanvas');
        var hammer = new Hammer(mycvs);
        hammer.get('pinch').set({ enable: true });
        hammer.get('pan').set({threshold: 3});
        function hammer_msg(_type,_val){
            overlay_msg(_type+": "+_val,1000);
        }
        var hammer_counter_scale = 0;
        var scale_before_interact = this.active_settings.scale;
        hammer.on('pinchstart', (e)=>{
            _G.HAMMER_INTERACTION = true;
        });
        hammer.on('pinchend', (e)=>{
            scale_before_interact = this.active_settings.scale;
            setTimeout(()=>{ _G.HAMMER_INTERACTION = false; },100);
        });
        hammer.on('pinch', (e)=>{
            this.active_settings.scale = e.scale*scale_before_interact;
            hammer_counter_scale++;
            if(hammer_counter_scale%5===0){ //hammer has too many events
                if(this.models && this.models[_G.AINDEX].mesh){
                    var s = this.active_settings.scale * _G.GLOBAL_SCALE_ADJUST;
                    this.models[_G.AINDEX].mesh.scale.set(s,s,s);
                    hammer_msg( "SCALE", (Math.round(this.active_settings.scale*10)/10) );
                }
            }
        });
        hammer.on('panstart', (e)=>{
            _G.HAMMER_INTERACTION = true;
        });
        hammer.on('panend', (e)=>{
            setTimeout(()=>{ _G.HAMMER_INTERACTION = false; },100);
        });
        var rotation_val = 0;
        var rotation_val_deg = 0;
        var rotation_val_deg_prev = 0;
        hammer.on('panleft', (e)=>{
            var drag_x = (Math.abs(e.deltaX)/window.innerWidth)*0.18; 
            rotation_val -= drag_x;
            if(rotation_val<0){ rotation_val=(Math.PI*1.99); }
            //dlog("------------- rotation "+rotation_val);
            rotation_val_deg = rotation_val * (180/Math.PI);
            if( Math.abs(rotation_val_deg-rotation_val_deg_prev)>=2 ){
                rotation_val_deg_prev = rotation_val_deg;
                if(this.models && this.models[_G.AINDEX].mesh){
                    this.models[_G.AINDEX].mesh.rotation.y = rotation_val;
                    rotation_val_deg = Math.round(rotation_val_deg);
                    //hammer_msg( "ROTATION", rotation_val_deg+"'" );
                }
            }
        });
        hammer.on('panright', (e)=>{
            var drag_x = (Math.abs(e.deltaX)/window.innerWidth)*0.18; 
            rotation_val += drag_x;
            if(rotation_val>(Math.PI*2)){ rotation_val=0.01; }
            //dlog("------------- rotation "+rotation_val);
            rotation_val_deg = rotation_val * (180/Math.PI);
            if( Math.abs(rotation_val_deg-rotation_val_deg_prev)>=2 ){
                rotation_val_deg_prev = rotation_val_deg;
                if(this.models && this.models[_G.AINDEX].mesh){
                    this.models[_G.AINDEX].mesh.rotation.y = rotation_val;
                    rotation_val_deg = Math.round(rotation_val_deg);
                    //hammer_msg( "ROTATION", rotation_val_deg+"'" );
                }
            }
        });
        var speed_val = 1.0;
        hammer.on('panup', (e)=>{
            var drag_y = (Math.abs(e.deltaY)/window.innerHeight)*0.08; 
            speed_val += drag_y;
            var prefix = "";
            if(speed_val>3){
                speed_val=3;
                prefix = "MAX ";
            }
            //dlog("------------- speed up "+speed_val);
            if(speed_val!==this.active_settings.speed){
                this.active_settings.speed = speed_val;
                if(this.models && this.models[_G.AINDEX].speed){
                    this.models[_G.AINDEX].speed = this.active_settings.speed;
                    hammer_msg( prefix+" SPEED", (Math.round(this.active_settings.speed*10)/10) );
                    this.apply_settings_to_others_with_same_move();
                }
                
            }
        });
        hammer.on('pandown', (e)=>{
            var drag_y = (Math.abs(e.deltaY)/window.innerHeight)*0.08; 
            speed_val -= drag_y;
            var prefix = "";
            if(speed_val<0.25){
                speed_val=0.25;
                prefix = "MIN ";
            }
            //dlog("------------- speed down "+speed_val);
            if(speed_val!==this.active_settings.speed){
                this.active_settings.speed = speed_val;
                if(this.models && this.models[_G.AINDEX].speed){
                    this.models[_G.AINDEX].speed = this.active_settings.speed;
                    hammer_msg( prefix+" SPEED", (Math.round(this.active_settings.speed*10)/10) );
                    this.apply_settings_to_others_with_same_move();
                }
            }
        });

    }

    //===========================================================================================================
    init_assets(_cb){

        this.data_url;

        console.log("here1");

        if(_G.FORMAT==="dae"){ this.data_url = "json/dae.json?"+Date.now(); }
        if(_G.FORMAT==="fbx"){ this.data_url = "json/fbx.json?"+Date.now(); }
        if(_G.FORMAT==="gltf"){ this.data_url = "json/gltf.json?"+Date.now(); }

        $.getJSON(this.data_url).success((data)=>{

            console.log("here2");

            this.assets = data.assets;

            dlog("Init "+_G.FORMAT.toUpperCase()+" Assets:");
            dlog(this.assets);

            console.log("here3");

            _cb();

        }).error(function(jqXHR, textStatus, errorThrown){

            console.log("error " + textStatus);
            console.log("incoming Text " + jqXHR.responseText);

        });
    }

    //===========================================================================================================
    populate_models_and_thumbs(){

        for(var i=0;i<_G.COUNT;i++){

            var amodel = {
                mesh:                   undefined,
                move:                   undefined,
                mixer:                  undefined,
                matrix:                 undefined,
                y:                      0,
                x:                      0,
                z:                      0,
                scale:                  1,
                vertical_shift:         0,
                rotation:               0,
                speed:                  1.0,
                body_mosh: 			    0,
                neck_mosh: 			    0,
                arm_mosh:               0,
                mosh_speed: 		    2.5,
                head:                   1.0,
                feet:                   1.0,
            };

            this.models.push( amodel );
            var thumb_html = '<div class="athumb_model" id="thumb_'+i+'" data-index="'+i+'"></div>';
            $('#thumbs_container_content').append( thumb_html );
        }

        //we always have a text
        if(_G.TEXT3D_ENABLED){
            var thumb_html = '<div class="athumb_text"><img src="img/text3d.gif" width="100%" height="100%"></div>';
            $('#thumbs_container_content').append( thumb_html );
        }

        $('#thumbs_container_content').children().first().addClass("border_pulser");

        dlog("Populated Empty Models:");
        dlog(this.models);

    }

    //===========================================================================================================
    populate_library(){

        var library = [];

        for(var i=0;i<this.assets.length;i++){
            var uid = this.assets[i].uid;
            var name = this.assets[i].name;
            for(var j=0;j<this.assets[i].moves.length;j++){
                var move = this.assets[i].moves[j];
                var move_uc = move.toUpperCase();
                var thumb = "thumbs/"+_G.FORMAT+"/"+uid+"/"+move+"."+_G.THUMB_TYPE;
                library.push({thumb:thumb,move:move,move_uc:move_uc,name:name,uid:uid});
            }
        }

        var library2 = this.shuffle(library);

        for(var i=0;i<library2.length;i++){

            var html = '<div class="model_row" data-index="'+i+'" data-uid="'+library2[i].uid+'" data-move="'+library2[i].move+'"><img src="'+library2[i].thumb+'" width="100%"><br>'+library2[i].name+'<div class="model_move">'+library2[i].move_uc+'</div></div>';
            $("#models_container").append(html);

        }

        $("#models_container").append('<div style="clear:both;"></div><div class="models_br"></div><div class="models_more flicker">MORE MODELS COMING SOON!</div><div class="models_br"></div>');

        dlog("Populated Thumb Library:");
        dlog(library2);

    }
    shuffle(a){
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    //===========================================================================================================
    apply_settings_to_others_with_same_move(){
        for(var i=0;i<this.models.length;i++){
            if(this.models[i].mesh){
                if(i!==_G.AINDEX){
                    if(this.models[i].move===this.models[_G.AINDEX].move){
                        dlog(i+ "apply settings for move match, "+this.models[_G.AINDEX].move);
                        this.models[i].body_mosh = this.active_settings.body_mosh;
                        this.models[i].neck_mosh = this.active_settings.neck_mosh;
                        this.models[i].arm_mosh = this.active_settings.arm_mosh;
                        this.models[i].mosh_speed = this.active_settings.mosh_speed;
                        this.models[i].speed = this.models[_G.AINDEX].speed;
                    }
                }
            }
        }
    }

    //===========================================================================================================
    update(){

        //------------------------------------------------------------------------
        //update animation
        this.dt = this.clock.getDelta();
        for(var i=0;i<this.models.length;i++){
            if(this.models[i].mesh && this.models[i].mixer){
                this.models[i].mixer.update( this.dt * this.models[i].speed ); 
            }
        }

        //------------------------------------------------------------------------
        //mosh
        this.mosh_counter++;
        for(var i=0;i<this.models.length;i++){
            if(this.models[i].mesh){
                this.models[i].mesh.traverse((child)=>{
                    if( child.isBone ){
                        if(this.models[i].neck_mosh!==0){
                            if( child.name.includes("Neck") ){ 
                                child.rotation.x = Math.cos((this.mosh_counter/(1.5+(5-this.models[i].mosh_speed)))*this.models[i].speed)*this.models[i].neck_mosh;
                            }
                        }
                        if(this.models[i].body_mosh!==0){
                            if( child.name==="mixamorig_Spine" || child.name==="Spine" ){
                                child.rotation.x = Math.cos((this.mosh_counter/(1.5+(5-this.models[i].mosh_speed)))*this.models[i].speed)*this.models[i].body_mosh;
                                child.rotation.y = Math.cos((this.mosh_counter/(1.5+(5-this.models[i].mosh_speed))*0.5)*this.models[i].speed)*this.models[i].body_mosh;
                            }
                        }
                        if(this.models[i].arm_mosh!==0){
                            if( child.name.includes("LeftArm") || child.name.includes("RightArm") ){
                                child.rotation.x = Math.cos((this.mosh_counter/(1.5+(5-this.models[i].mosh_speed)))*this.models[i].speed)*this.models[i].arm_mosh;
                                child.rotation.y = Math.sin((this.mosh_counter/(1.5+(5-this.models[i].mosh_speed)))*this.models[i].speed)*this.models[i].arm_mosh;
                            }
                        }
                    }
                });
            }
        }

        //------------------------------------------------------------------------
        //scale
        for(var i=0;i<this.models.length;i++){
            if(this.models[i].mesh){
                this.models[i].mesh.traverse((child)=>{
                    if( child.isBone ){
                        //head
                        if(child.name=="mixamorig_Neck" || child.name.includes("Neck")){ 
                            var s = this.models[i].head;
                            child.scale.set(s,s,s);
                        }
                        //feet
                        if(child.name=="mixamorig_RightFoot" || child.name=="mixamorig_LeftFoot" || child.name.includes("LeftFoot") || child.name.includes("RightFoot") ){
                            var s = this.models[i].feet;
                            child.scale.set(s,s,s);
                        }
                    }
                });
            }
        }


    }

    //===========================================================================================================
    update_gui_settings_for_active_index(){

        if(this.models[_G.AINDEX].mesh){

            //these are the active_settings that are used by dat-gui
            this.active_settings.body_mosh = this.models[_G.AINDEX].body_mosh;
            this.active_settings.neck_mosh = this.models[_G.AINDEX].neck_mosh;
            this.active_settings.arm_mosh = this.models[_G.AINDEX].arm_mosh;
            this.active_settings.mosh_speed = this.models[_G.AINDEX].mosh_speed;
            this.active_settings.vertical_shift = this.models[_G.AINDEX].vertical_shift;
            this.active_settings.head = this.models[_G.AINDEX].head;
            this.active_settings.feet = this.models[_G.AINDEX].feet;

        }

    }

    //===========================================================================================================
    reset_amodel_object(){

        var _obj = {};

        _obj.mesh = undefined;
        _obj.move = undefined;
        _obj.mixer = undefined;
        _obj.group = undefined;
        _obj.matrix = undefined; 

        _obj.y = 0;
        _obj.x = 0;
        _obj.z = 0;

        _obj.scale = 1.0;
        _obj.rotation = 0;
        _obj.speed = 1.0;

        _obj.body_mosh = 0;
        _obj.neck_mosh = 0;
        _obj.arm_mosh = 0;
        _obj.mosh_speed = 2.5;

        _obj.vertical_shift=0;
        _obj.head = 1.0;
        _obj.feet = 1.0;

        return _obj;

    }

    //===========================================================================================================
    remove_model_from_scene(){

        if(this.models[_G.AINDEX].mesh){

            _G.MYTHREE.scene.remove( this.models[_G.AINDEX].mesh );

            this.models[_G.AINDEX] = undefined;
            this.models[_G.AINDEX] = this.reset_amodel_object();

            $("#thumb_"+_G.AINDEX).html("");

            this.reset_active_index();

        }
    }

    //===========================================================================================================
    reset_active_index(){

        if(_G.COUNT===1){ 
            _G.AINDEX=0; 
            return; 
        }

        var found = false;
        for(var i=0;i<this.models.length;i++){
            if(this.models[i].mesh){
                found = true;
                _G.AINDEX = i;
                break;
            }
        }
        if(!found){
            _G.AINDEX = 0;
        }

        $(".athumb_model,.athumb_text").removeClass("border_pulser");
        $("#thumb_"+_G.AINDEX).addClass("border_pulser");

        this.update_gui_settings_for_active_index();

    }

    //===========================================================================================================
    set_active_index(_index){

        if(_G.COUNT===1){ _G.AINDEX=0; return; }

        _G.AINDEX = _index;

        $(".athumb_model,.athumb_text").removeClass("border_pulser");
        $("#thumb_"+_G.AINDEX).addClass("border_pulser");

        this.update_gui_settings_for_active_index();

    }

    //===========================================================================================================
    load_model(_uid,_move,_index,_cb){

        if(_G.COUNT===1){

            _G.AINDEX=0;

        }else{

            if(_index===-1){ //if -1 we must find the index (next empty one)
                var free_index = false;
                for(var i=0;i<this.models.length;i++){ //0,1,2
                    if(!this.models[i].mesh){
                        free_index = true;
                        _G.AINDEX = i;
                        break;
                    }
                }
                if(!free_index){ 
                    $("#log").prepend("can't find free index");
                    return; 
                }
            }else{
                _G.AINDEX = _index;
            }

        }

        this.loading = true;
        $("#ui_select_model").css("opacity","0.40");

        var asset;
        for(var i=0;i<this.assets.length;i++){
            if(this.assets[i].uid===_uid){
                asset = this.assets[i];
                break;
            }
        }
        if(!asset){ 
            console.log("Couldn't find asset for uid: "+_uid); 
            dlog("Couldn't find asset for uid: "+_uid);
            return; 
        }

        if(!this.first_placement){
            overlay_msg("LOADING MODEL",25000);
        }
        
        var file_to_load = "models/"+_G.FORMAT+"/"+_uid+"/"+_move+"."+_G.FORMAT ;

        console.log("Loading file, "+file_to_load);
        dlog("Loading file, "+file_to_load);

        //------------------------------------------------------------------------------
        if(_G.FORMAT==="dae"){
            this.collada_loader.load(file_to_load,(_mesh)=>{
                this.handle_mesh(asset,_uid,_move,_mesh.scene,_mesh,_cb);
            },progressFunction,errorFunction);
        }

        //------------------------------------------------------------------------------
        if(_G.FORMAT==="gltf"){
            this.gltf_loader.load(file_to_load,(_mesh)=>{
                this.handle_mesh(asset,_uid,_move,_mesh.scene,_mesh,_cb);
            },progressFunction,errorFunction);
        }

        function progressFunction(p){
            //console.log(p);
        }
        function errorFunction(e){
            console.log("Error, ");
            console.log(e);
            dlog(e);
        }

    }

    //===========================================================================================================
    handle_mesh(_asset,_uid,_move,_mesh,_parent,_cb){

            //thumbnail
            var thumb = "thumbs/"+_G.FORMAT+"/"+_uid+"/"+_move+"."+_G.THUMB_TYPE;
            $("#thumb_"+_G.AINDEX).html('<img src="'+thumb+'" class="athumb_img">');

            //remove existing mesh
            if(this.models[_G.AINDEX].mesh){ 
                _G.MYTHREE.scene.remove(this.models[_G.AINDEX].mesh); 
                this.models[_G.AINDEX].mesh = undefined;
            }

            console.log('MESH:');
            console.log(_mesh);

            //new mesh
            this.models[_G.AINDEX].mesh = _mesh;

            //move
            this.models[_G.AINDEX].move = _move;

            //setup animation
            if(_parent && _parent.animations){
                this.models[_G.AINDEX].mixer = new THREE.AnimationMixer( _mesh );
                var animations = _parent.animations;
                this.models[_G.AINDEX].mixer.clipAction(animations[0]).play();
                this.models[_G.AINDEX].mixer.update(0.1);
            }

            //traverse, settings
            this.models[_G.AINDEX].mesh.traverse(( child ) => {
                if ( child instanceof THREE.Mesh ) {
                    child.frustumCulled = false;
                    child.castShadow = true; 
                    child.receiveShadow = false; 
                    child.material.transparent = true;
                    child.material.alphaTest = _asset.alpha_test;
                    child.material.side = THREE.DoubleSide;
                    if( child.material.metalness ){
                        child.material.metalness = 0;
                    }
                }
            });

            //matrix
            if(this.models[_G.AINDEX].matrix){
                this.models[_G.AINDEX].mesh.position.setFromMatrixPosition( this.models[_G.AINDEX].matrix );
            }

            //scale
            var s = this.active_settings.scale * _G.GLOBAL_SCALE_ADJUST;
            this.models[_G.AINDEX].mesh.scale.set(s,s,s);

            //add
            _G.MYTHREE.scene.add( this.models[_G.AINDEX].mesh );

            //sync all
            for(var i=0;i<this.models.length;i++){
                if(this.models[i].mixer){
                    this.models[i].mixer._actions[0].time = 0;
                }
            }

            $("#ui_select_model").css("opacity","1.00");

            if(_G.UI_SEE){
                $("#ui_target").css("opacity","1");
                _G.MYTHREE.target_ring.visible = true;
                _G.TARGET_ACTIVE = true;
            }

            this.models[_G.AINDEX].mesh.visible = false; //must tap to make visible

            if(!this.first_placement){ 
                overlay_msg('<u>TAP</u> TO PLACE MODEL',3000); 
            };

            this.loading = false;

            _cb(); 


    }


    //===========================================================================================================
    update_mesh_location(_matrix){

        if(this.models[_G.AINDEX].mesh && _matrix){

            $("#log").prepend("update index "+_G.AINDEX+" matrix");

            this.models[_G.AINDEX].mesh.visible = true;
            this.models[_G.AINDEX].mesh.position.setFromMatrixPosition( _matrix );
            this.models[_G.AINDEX].matrix = _matrix;

            if(this.models[_G.AINDEX].mesh.position.y < this.shadowplane_y){ //we put shadowplane at lowest point
                this.shadowplane_y = this.models[_G.AINDEX].mesh.position.y;
                _G.MYTHREE.shadowplane.position.y = this.shadowplane_y;
            }

            this.models[_G.AINDEX].vertical_shift = this.models[_G.AINDEX].mesh.position.y
            this.active_settings.vertical_shift = this.models[_G.AINDEX].mesh.position.y;

            if(this.first_placement){
                this.first_placement = false;
                $("#message_content").html(""); 
                $("#message_container").hide();
                $(".ui_elem").fadeIn(1000);
                _G.MYTHREE.shadowplane.visible = true;
            }

            //last positions
            this.last_matrix = _matrix;
            var q = new THREE.Quaternion();
            var p = new THREE.Vector3();
            var s = new THREE.Vector3();
            _matrix.decompose( p, q, s );
            this.last_position = new THREE.Vector3(p.x,0,p.z);

        }
    }


    //===========================================================================================================
    setup_gui(){

		var f = _G.DATGUI.addFolder('Model Adjust');

            f.add(this.active_settings, 'vertical_shift', -2, 2, 0.01).name("Vertical Shift").listen().onChange((val)=>{
                if(this.models[_G.AINDEX].mesh){
                    this.models[_G.AINDEX].mesh.position.y = val;
                    this.active_settings.vertical_shift = val;
                }
            });
            f.add(this.active_settings, 'head', 0.50, 2.0, 0.1).name("Head Size").listen().onChange((val)=>{
                if(this.models[_G.AINDEX].mesh){
                    this.models[_G.AINDEX].head = val;
                    this.scale_change = true;
                }
            });
            f.add(this.active_settings, 'feet', 0.50, 2.0, 0.1).name("Feet Size").listen().onChange((val)=>{
                if(this.models[_G.AINDEX].mesh){
                    this.models[_G.AINDEX].feet = val;
                    this.scale_change = true;
                }
            });

        var f2 = _G.DATGUI.addFolder('Model Mosh');

            f2.add(this.active_settings, 'neck_mosh', 0, 1, 0.1).name("Neck Mosh").listen().onChange((val)=>{
                if(this.models[_G.AINDEX].mesh){
                    this.models[_G.AINDEX].neck_mosh = val;
                    this.apply_settings_to_others_with_same_move();
                }
            });
            f2.add(this.active_settings, 'body_mosh', 0, 1, 0.1).name("Body Mosh").listen().onChange((val)=>{
                if(this.models[_G.AINDEX].mesh){
                    this.models[_G.AINDEX].body_mosh = val;
                    this.apply_settings_to_others_with_same_move();
                }
            });
            f2.add(this.active_settings, 'arm_mosh', 0, 1, 0.1).name("Arm Mosh").listen().onChange((val)=>{
                if(this.models[_G.AINDEX].mesh){
                    this.models[_G.AINDEX].arm_mosh = val;
                    this.apply_settings_to_others_with_same_move();
                }
            });
            f2.add(this.active_settings, 'mosh_speed', 0, 5, 0.01).name("Mosh Speed").listen().onChange((val)=>{
                if(this.models[_G.AINDEX].mesh){
                    this.models[_G.AINDEX].mosh_speed = val;
                    this.apply_settings_to_others_with_same_move();
                }
            });

    }




}


class Mp3{ 


    //======================================================================================
    constructor(){

        this.mp3s =  [

            {genre:"GTECH",name:"Shake What Ya Mama Gave Ya",file:"mp3/shake_what_ya_mama_gave_ya_PARARTY.mp3",mp3:undefined},
            {genre:"METAL",name:"Killing In The Name Of",file:"mp3/killing_in_the_name_of_PARARTY.mp3",mp3:undefined},
            {genre:"HARDCODE",name:"Das Modul 1100101",file:"mp3/das_modul_1100101_PARARTY.mp3",mp3:undefined},
            {genre:"GROOVE",name:"Genius Of Love",file:"mp3/genius_of_love_PARARTY.mp3",mp3:undefined},
            {genre:"TOLLYWOOD",name:"Adavi Donga",file:"mp3/nandanavanam_PARARTY.mp3",mp3:undefined},
            {genre:"DREAMY",name:"Enya Orinoco Flow",file:"mp3/enya_orinoco_flow_PARARTY.mp3",mp3:undefined},
            {genre:"BREAKBEAT",name:"Mr Oizo Electro Non Stop Shit",file:"mp3/mr_oizo_electro_non_stop_PARARTY.mp3",mp3:undefined},
            {genre:"GROOVE",name:"Ronnie Jones Video Games",file:"mp3/ronnie_jones_video_games_PARARTY.mp3",mp3:undefined},
            {genre:"FREEDOM",name:"Sizzler 1991",file:"mp3/sizzler_1991_PARARTY.mp3",mp3:undefined},
            {genre:"GROOVE",name:"Kasso Walkman",file:"mp3/kasso_walkman_PARARTY.mp3",mp3:undefined},
            {genre:"RAP",name:"Lil' Windex Cleaning Up",file:"mp3/lil_windex_cleaning_up_PARARTY.mp3",mp3:undefined},
            {genre:"DANCE",name:"Gigi Dagostino Fly With You",file:"mp3/gigi_dagostino_fly_with_you_PARARTY.mp3",mp3:undefined},
            //{name:"[DANCE] Aerobic Championship Theme",file:"mp3/aerobics.mp3",mp3:undefined},
            {genre:"HARDCODE",name:"Forever Young Happy Hardcode",file:"mp3/forever_young_happy_hardcode_PARARTY.mp3",mp3:undefined},
            {genre:"GROOVE",name:"Polo&Pan Le Forest of Hamsters",file:"mp3/the_forest_polopan_PARARTY.mp3",mp3:undefined},
            //{genre:"GOSPEL",name:"Reverend Milton It's Gonna Rain",file:"mp3/its_gonna_rain_PARARTY.mp3",mp3:undefined},
            {genre:"RAP",name:"Lykke Li Money",file:"mp3/money_PARARTY.mp3",mp3:undefined},
            {genre:"DANCE",name:"Alice DJ Better Off Alone",file:"mp3/alice_dj_better_off_alone_PARARTY.mp3",mp3:undefined},
            {genre:"BREAKBEAT",name:"Mark Pritchard Wind It Up",file:"mp3/mark_pritchard_wind_it_up_PARARTY.mp3",mp3:undefined},
            {genre:"HARDCODE",name:"Scott Brown Elysium",file:"mp3/scott_brown_elysium_PARARTY.mp3",mp3:undefined},
            {genre:"ELECTRO",name:"Mr Oizo Transexual",file:"mp3/mr_oizo_transexual_PARARTY.mp3",mp3:undefined},
            
            
            
        ];

        this.index = undefined;

        this.is_playing = false;
        this.is_loading = false;

        this.populate_list();
        this.init_interactions();

    }


    //======================================================================================
    init_interactions(){

        var that = this;

        //--------------------------------------------------------------------------------
        //pause when window out of focus
        $(window).blur(()=>{
            if(this.index===undefined){return;}
            if(this.mp3s[this.index].mp3){
                this.mp3s[this.index].mp3.pause();
            }
        });
        $(window).focus(()=>{
            if(this.index===undefined){return;}
            if(this.is_playing){
                if(this.mp3s[this.index].mp3){
                    this.mp3s[this.index].mp3.play();
                }
            }
        });

        //--------------------------------------------------------------------------------
        //show song container
        $("#ui_select_song").click(function(){
            if(_G.MYAUDIO.is_loading){return;}
            $("#songs_container").show();
        });
        $("#songs_close").click(function(){
            $("#songs_container").hide();
        });

        //--------------------------------------------------------------------------------
        //audio
        $(document).on('click','.song_row', function(e) {

            var index = $(this).attr("data-index");
            $("#songs_container").hide();
            _G.MYAUDIO.play_at_index(index);
            $(".song_row_mute").html("MUTE MUSIC");

        });
        $(document).on('click','.song_row_mute', function(e) {

            _G.MUTED = !_G.MUTED;
            if(_G.MUTED){
                that.is_playing = false;
                $(".song_row_mute").html("UNMUTE MUSIC");
                
            }else{
                that.is_playing = true;
                $(".song_row_mute").html("MUTE MUSIC");
            }
            _G.MYAUDIO.mute(_G.MUTED);

        });

    }


    //======================================================================================
    populate_list(){

        var html = '<div class="song_row_mute">MUTE MUSIC</div>';
        $("#songs_container").append(html);
        for(var i=0;i<this.mp3s.length;i++){
            var html = '<div class="song_row" data-index="'+i+'"><span style="font-weight:300;font-style:italic;">'+this.mp3s[i].genre+'</span><div style="height:3px;"></div>'+this.mp3s[i].name+'</div>';
            $("#songs_container").append(html);
        }
        $("#songs_container").hide();

    }


    //======================================================================================
    play_at_index(i){

        if(this.is_loading){return;}

        //stop existing
        if(this.index!==undefined){
            if(this.mp3s[this.index].mp3){
                this.mp3s[this.index].mp3.pause();
            }
        }

        //play
        if(this.mp3s[i].mp3===undefined){ //load if not loaded

            $("#ui_select_song").css("opacity","0.40");

            this.is_loading = true;

            this.mp3s[i].mp3 = new Howl({
                src: [this.mp3s[i].file],
                autoplay: false,
                loop: true,
                volume: 0.85,
            });

            this.mp3s[i].mp3.once('load', ()=>{
                this.mp3s[i].mp3.play();
                this.is_playing = true;
                this.is_loading = false;
                $("#ui_select_song").css("opacity","1.0");
            });

        }else{

            this.mp3s[i].mp3.play();
            this.is_playing = true;
            this.is_loading = false;

        }

        this.index = i;

        $(".song_row_mute").html("MUTE MUSIC");

    }

    
    //======================================================================================
    mute(_bool){

        if(this.index!==undefined){
            if(this.mp3s[this.index].mp3){

                if(_bool){
                    this.mp3s[this.index].mp3.pause();
                }else{
                    this.mp3s[this.index].mp3.play();
                }

            }
        }

    }

}


class Text3D{

    //====================================================================================
    constructor(){

        this.text = {
                        group:          new THREE.Object3D(),
                        mesh:           undefined,
                        x:              0,
                        z:              0,
                        y:              0,
                        scale:          1,
                        depth_scale:    1,
                        ry:             0,
                        rx:             0,
                        color:          "#ff0000",
                        shininess:      5,
        };

        this.text_size = 0.1;
        this.text_depth = this.text_size*0.15;
        this.font;

        var font_loader = new THREE.FontLoader();
        font_loader.load( "fonts/Poppins_Black_Regular.json",( _font )=>{
            this.font = _font;
        });

        this.init();
        this.init_interactions();
        this.setup_gui();

        this.focus_input = false;

        this.datgui_folder;

    }

    //====================================================================================
    init(){

        _G.MYTHREE.scene.add( this.text.group );

    }

    //====================================================================================
    keyboard_focus(_bool){

        if(_bool && !this.focus_input){
            $("#text3d_form").css("width","100%").css("height","auto");
            if(1){
                var target = document.getElementById("text_input");
                target.focus(); 
                target.click(); 
                $('#text_input').focus(); 
            }
            this.focus_input = true;

        }

        if(!_bool && this.focus_input){
            $("#text3d_form").css("width","0px").css("height","0px");
            if(1){
                $('#text_input').attr('disabled', 'false'); 
                setTimeout(function() {
                    $('#text_input').blur();  
                    $('#text_input').removeAttr('disabled');
                }, 100);
            }
            this.focus_input = false;
        }

    }

    //====================================================================================
    init_interactions(){

        //--------------------------------------------------------------------------------
        //click thumb TEXT
        $(document).on('click','.athumb_text',function(){

            $(".athumb_model,.athumb_text").removeClass("border_pulser");
            $(this).addClass("border_pulser");

            _G.TEXT3D_ACTIVE = true;

            if(!_G.MYTEXT.text.mesh ){
                _G.MYTEXT.keyboard_focus(true);
            }

        });

        //--------------------------------------------------------------------------------
        //click text icon
        $("#ui_text").click(function(){

            _G.MYTEXT.clear();

            $(".athumb_model,.athumb_text").removeClass("border_pulser");
            $(".athumb_text").addClass("border_pulser");

            _G.TEXT3D_ACTIVE = true;

            _G.MYTEXT.keyboard_focus(true);
            
        });

        //--------------------------------------------------------------------------------
        //prevent page reload on form submit
        $("#text3d_form").submit(function(e) {
            e.preventDefault();
        });

        //--------------------------------------------------------------------------------
        //submit form ("Go" button on Android)
        $("#text3d_form").submit(function(){

            $("#message_content").html(""); 
            $("#message_container").hide();

            var msg = $("#text_input").val();

            if(msg && msg!==""){

                _G.MYTEXT.create(msg);
                //$("#text_input").val(""); 
                _G.MYTEXT.keyboard_focus(false);

            }

        });

    }

    //====================================================================================
    create(_msg){

        if(!this.font){return;}

        if(this.text.mesh){
            _G.MYTHREE.scene.remove(this.text.mesh);
        }

        var geometry = new THREE.TextGeometry( _msg, {font:this.font, size:this.text_size, height:this.text_depth, curveSegments:12, bevelEnabled:false,});

        geometry.computeBoundingBox();
        geometry.center();

        var material = new THREE.MeshPhongMaterial({ color:this.text.color, specular:0xffffff, shininess:this.text.shininess });

        this.text.mesh = new THREE.Mesh( geometry, material );

        this.text.x = _G.MYMODEL.last_position.x;
        this.text.z = _G.MYMODEL.last_position.z;

        $("#log").prepend("last position: "+this.text.x+","+this.text.y+","+this.text.z);

        this.text.mesh.position.set(this.text.x,this.text.y,this.text.z);
        this.text.mesh.rotation.set(this.text.rx,this.text.ry,0);
        this.text.mesh.scale.set(this.text.scale,this.text.scale,this.text.scale);

        _G.MYTHREE.scene.add( this.text.mesh );

        this.datgui_folder.show();

        if(_G.UI_SEE){
            $("#ui_target").css("opacity","1");
            _G.MYTHREE.target_ring.visible = true;
            _G.TARGET_ACTIVE = true;
        }

    }

    //====================================================================================
    clear(){

        if(this.text.mesh){
            _G.MYTHREE.scene.remove(this.text.mesh);
            this.text.mesh = undefined;
            _G.MYMODEL.reset_active_index();
            this.datgui_folder.hide();
        }

    }

    //=====================================================================================
    update_mesh_location(_matrix){

        if(this.text.mesh && _matrix){

            var q = new THREE.Quaternion();
            var p = new THREE.Vector3();
            var s = new THREE.Vector3();
            _matrix.decompose( p, q, s );
            _G.MYMODEL.last_position = new THREE.Vector3( p.x, 0, p.z );

            this.text.x = _G.MYMODEL.last_position.x;
            this.text.z = _G.MYMODEL.last_position.z;
            this.text.mesh.position.set( this.text.x, this.text.mesh.position.y, this.text.z );

        }
        
    }
    
    //====================================================================================
    setup_gui(){

        this.datgui_folder = _G.DATGUI.addFolder('3D Text');

            this.datgui_folder.add(this.text, 'ry', -Math.PI*2, Math.PI*2, 0.01).name("Rotation").onChange((val)=>{
                if(this.text.mesh){ this.text.mesh.rotation.y = val; }
            });
            this.datgui_folder.add(this.text, 'y', -2, 2, 0.01).name("Height").onChange((val)=>{
                if(this.text.mesh){ this.text.mesh.position.y = val; }
            });
            this.datgui_folder.add(this.text, 'scale', 0.1, 3, 0.01).name("Uniform Scale").onChange((val)=>{
                if(this.text.mesh){ this.text.mesh.scale.set( val, val, val ); }
            });
            this.datgui_folder.add(this.text, 'depth_scale', 0.01, 10, 0.01).name("Depth").onChange((val)=>{
                if(this.text.mesh){ this.text.mesh.scale.set( this.text.scale, this.text.scale ,val ); }
            });
            this.datgui_folder.addColor(this.text, 'color').name("Color").onChange((val)=>{
                if(this.text.mesh){ this.text.mesh.material.color.set(val); }
            });
            
        this.datgui_folder.hide();

    }


}


function init_interact(){


    //--------------------------------------------------------------------------------
    //it thinks touches on the UI are touches for 3D positioning
    $(document).on('touchstart', function(e) {
        var target = $(e.target);
        if(target[0].id==="mycanvas"){
            _G.TOUCH_ON_CANVAS = true;
            _G.MYTEXT.keyboard_focus(false);
            dlog("touch, canvas");
        }else{
            _G.TOUCH_ON_CANVAS = false;
            dlog("touch, other, "+target[0].id);
        }
    }); 
    var touch_moved = 0;
    $(document).on('touchstart', function(e) {
        touch_moved = 0;
    });
    $(document).on('touchmove', function(e) {
        touch_moved = 1;
    });
    $(document).on('touchend', function(e) {
        if(!touch_moved){
            _G.TOUCH_TAP = true;
        }else{
            _G.TOUCH_TAP = false;
        }
    });

    //--------------------------------------------------------------------------------
    //toggle target
    $("#ui_target").click(function(){

        if(!_G.UI_SEE){return;} //

        _G.TARGET_ACTIVE = !_G.TARGET_ACTIVE;

        if(_G.TARGET_ACTIVE){
            $("#ui_target").css("opacity","1");
            _G.MYTHREE.target_ring.visible = true; //!!! not going visible?
            overlay_msg("TARGET IS <u>ON</u>",2000);
        }else{
            $("#ui_target").css("opacity","0.40");
            _G.MYTHREE.target_ring.visible = false;
            overlay_msg("TARGET IS <u>OFF</u>",2000);
        }

    });


    //--------------------------------------------------------------------------------
    //remove from scene, text or model
    $("#ui_remove").click(function(){

        if(_G.TEXT3D_ACTIVE){
            _G.MYTEXT.clear();
            _G.TEXT3D_ACTIVE = false;
        }else{
            _G.MYMODEL.remove_model_from_scene();
        }

    });

    //--------------------------------------------------------------------------------
    //reload
    $("#ui_reload").click(function(){
        $("#reload_container").show();
    });
    $("#reload_no").click(function(){
        $("#reload_container").hide();
    });
    $("#reload_yes").click(function(){
        window.location.reload();
    });
    
    //--------------------------------------------------------------------------------
    //about
    $("#ui_about").click(function(){
        overlay_msg("WWW.PARARTY.COM <div style='height:10px;'></div> BY @FUZZY_WOBBLE",4000);
    });

    //--------------------------------------------------------------------------------
    $("#ui_eye").click(function(){

        if(_G.UI_SEE_MODE===0){
            _G.UI_SEE = !_G.UI_SEE;
        }

        var msg = "";

        //gui 80,0
        //bnd 98,53,canvas_mask_height+10

        if(_G.UI_SEE){

            $(".ui_see").show();
            $("#ui_eye").css("width","18.8%");
            $("#bnd").show();
            $("#bnd").css("bottom","95px");
            $(".canvas_mask").hide();
            $("#mygui").show();
            $("#mygui").css("top","80px");
            msg = "UI VISIBLE";

        }else{

            dlog("UI see mode, "+_G.UI_SEE_MODE);

            if(_G.UI_SEE_MODE===0){

                $(".ui_see").hide();
                $("#ui_eye").css("width","98%");
                $("#ui_target").css("opacity","0.40");
                $("#bnd").css("bottom","50px");
                $("#mygui").css("top","0px");
                _G.MYTHREE.target_ring.visible = false;
                _G.TARGET_ACTIVE = false;
                msg = "UI MINIMAL";

                _G.UI_SEE_MODE = 1;

            }else if(_G.UI_SEE_MODE===1){

                var canvas_mask_height = (window.innerHeight-window.innerWidth)*0.5;
                $("#mask_bottom,#mask_top").css("height",canvas_mask_height+"px");
                $(".canvas_mask").show();
                $("#bnd").css("bottom",(canvas_mask_height+7)+"px");
                $("#mygui").hide();
                msg = "UI MASK + BRAND";

                _G.UI_SEE_MODE = 0;

            }else{

                //done

            }

        }

        // if(msg && msg!==""){
        //     if(to){clearTimeout(to);}
        //     $("#message_container").show();
        //     $("#message_content").html();
        //     to = setTimeout(()=>{ 
        //         $("#message_content").html(msg); 
        //         $("#message_container").hide();
        //     },2000);
        // }



    });


}


function init(){ //init


    //----------------------------------------------------------------
    //mozilla webxr
    //alert(navigator.userAgent);
    if(navigator.userAgent.indexOf("Mozilla")!==-1 && navigator.userAgent.indexOf("WebXRViewer")!==-1){

        // $(".using_webxr_viewer_button").show();
        // $(".using_webxr_viewer_button").click(function(){
        //     $("#intro_screen_1").hide();
        // });
        //alert("WebXRViewer");

        _G.IS_IOS = true;

        //----------------------------------------------------------------
        //check xr support
        if ( 'xr' in navigator ) {
            navigator.xr.isSessionSupported( 'immersive-ar' ).then(function(supported){
                if(!supported){
                    $("#intro_screen_1").show();
                    $("#checklist_row_webxr").show();
                    return;
                }
            });
        }

        alert("Apple support is still experimental and may not work on some devices. Once Safari supports webXR this will all be solved (:");

    }else{

        if(_G.RUN_COMPATIBLE_TESTS){

            //----------------------------------------------------------------
            //check android
            // var isAndroid = /(android)/i.test(navigator.userAgent);
            // if(!isAndroid){
            //     $("#intro_screen_1").show();
            //     $("#checklist_row_android").show();
            //     return;
            // }

            //----------------------------------------------------------------
            //check is chrome
            // var browsercheck =  bowser.parse(window.navigator.userAgent);
            // if(browsercheck.browser.name!=="Chrome"){
            //     $("#intro_screen_1").show();
            //     $("#checklist_row_chrome").show();
            //     return;
            // }

            //----------------------------------------------------------------
            //check modern chrome
            // var chromev = parseInt( browsercheck.browser.version.split(".")[0] );
            // if(chromev<80){
            //     $("#intro_screen_1").show();
            //     $("#checklist_row_chromev").show();
            //     return;
            // }

            //----------------------------------------------------------------
            //check xr support
            if ( 'xr' in navigator ) {
                navigator.xr.isSessionSupported( 'immersive-ar' ).then(function(supported){
                    if(!supported){
                        $("#intro_screen_1").show();
                        $("#checklist_row_webxr").show();
                        return;
                    }
                });
            }

        }   

    }




    //----------------------------------------------------------------
    //initilize classes
    _G.DATGUI = new dat.GUI({ autoPlace: false, width:window.innerWidth }); 
    var customContainer = document.getElementById( "mygui" );
    customContainer.appendChild(_G.DATGUI.domElement);
    _G.DATGUI.close();
    _G.MYTHREE = new ThreeJSforXR();
    _G.MYTHREE.renderer.outputEncoding = THREE.LinearEncoding;
    //_G.MYTHREE.renderer.outputEncoding = THREE.sRGBEncoding; //gltf hcap
    
    _G.MYMODEL = new Model();
    _G.MYAUDIO = new Mp3();
    if(_G.TEXT3D_ENABLED){ 
        _G.MYTEXT = new Text3D(); 
    }else{
        $("#text3d_form,#text_input,#button_add").remove();
    }
    _G.MYTHREE.start();



    if(!_G.DEBUG){
        $("#log").hide().removeClass("ui_see").removeClass("ui_elem");
    }else{
        $("#log").css("bottom","125px");
    }
    if(_G.BRAND_TEXT && _G.BRAND_TEXT!==""){
        $("#bnd").html(_G.BRAND_TEXT);
    }


    setTimeout(()=>{
        _G.FIRST_TAP_WAITING = false;
    },_G.FIRST_TAP_WAIT_MS);



    //----------------------------------------------------------------
    //initialize interactions
    init_interact();


    //----------------------------------------------------------------
    //fade
    setTimeout(()=>{ $("#blackout").fadeOut(500); },500);




}
$(document).ready(()=>{ 
    
    init(); 

});


window.ar_button_clicked = function(){

    dlog("click ARButton");

    $("#chrome_version").hide();
    $("#blackbacking").hide();
    $("#non_comm1,#non_comm2").hide();
    $("#ARButton").hide();

    var overlay_msg_html = '<u>SCAN</u> YOUR FLOOR SPACE <br><div style="height:7px;"></div>'+
        'THEN <u>TAP</u> TO PLACE MODEL<br><div style="height:70px;"></div>'+
        '<div style="width:80%;margin-left:10%;border-bottom:2px solid #eee;text-align:center;padding-bottom:2px;">C O N T R O L S</div><div style="height:9px;"></div>'+
        '<table style="width:80%;margin-left:10%;"><tr><td align="left">TAP</td><td align="right">POSITION<div style="height:6px;"></div></td></tr>'+
        '<tr><td align="left">PINCH</td><td align="right">SCALING<div style="height:6px;"></div></td></tr>'+
        '<tr><td align="left">HORIZ-DRAG</td><td align="right">ROTATE<div style="height:6px;"></div></td></tr>'+
        '<tr><td align="left">VERT-DRAG</td><td align="right">SPEED</td></tr></table>';
        
    overlay_msg(overlay_msg_html,15000);

    _G.MYAUDIO.play_at_index(0);

    _G.MYMODEL.load_model(_G.FIRST_LOAD_UID,_G.FIRST_LOAD_MOVE,0,()=>{
        dlog("Loaded default model: "+_G.FIRST_LOAD_UID+"-"+_G.FIRST_LOAD_MOVE);
    });

}
var to;
function overlay_msg(_msg,_duration){
    if(!_G.UI_SEE){return;}
    if(to){clearTimeout(to);}
    $("#message_container").show();
    $("#message_content").html(_msg);
    var h = parseInt($("#message_content").height());
    var mt = -h/2;
    $("#message_content").css("margin-top",mt+"px");
    to = setTimeout(()=>{ 
        $("#message_content").html(""); 
        $("#message_container").hide();
    },_duration);
}
window.onerror = function(error, url, line) {
    $("#log").prepend("<span style='color:#f00;'>"+error+", url: "+url+"</span><br>");
    $("#log").prepend("<span style='color:#f00;'>"+error+", line: "+line+"</span><br>");
};
function dlog(_msg){
    $("#log").prepend(_msg+"<br>");
    console.log(_msg);
}







































