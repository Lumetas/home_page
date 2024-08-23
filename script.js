const input = document.getElementById("input_command");
const form = document.getElementById("input_form");
const command_completer = document.getElementById("command_complete");
const defined_links = document.getElementById("defined_links");
const visual_menu = document.getElementById("visual_menu");
let index = 0;
let config_page = `
<input id='input_plugin' type="file">
<button onclick='plugin_manager.configure_plugin()'>load plugin</button>
<textarea id='plugins_list' style='width:100%; height:30vh; resize:none; padding:0; margin:0; border:none; background:rgb(10,10,10);'></textarea>
`;
let pressed = {};

function init(){
    if (localStorage.defined === undefined){localStorage.defined = '[]';}
    if (localStorage.plugins === undefined){localStorage.plugins = '[]';}
    plugin_manager.load_plugins();
}




const plugin_manager = {
    load_plugins(){
        let plugins = this.get_plugins();
        for (let i = 0; i < plugins.length; i++){
            this.load_plugin(localStorage['plug-' + plugins[i]]);
        }
    },

    get_plugins: function(){
        return JSON.parse(localStorage.plugins);
    },

    set_plugins: function(arr){
        localStorage.plugins = JSON.stringify(arr);
    },

    set_plugin : function(plug, name){
        localStorage['plug-' + name] = plug;
    },

    get_plugin : function(name){
        return localStorage['plug-' + name];
    },

    load_plugin: function(path){
        let scr = document.createElement("script");
        scr.src = path;
        document.body.appendChild(scr);
    },

    configure_plugin : function (){
        let file = document.getElementById('input_plugin').files[0];
        this.getBase64(file);
    },

    install_plugin : function(base64, name){
        let plugin = name.split('.');
        if (plugin.at(-1) !== "lum" || plugin.at(-2) !== "204"){return;}
        delete plugin[plugin.length -1];
        delete plugin[plugin.length -2];
        let plugin_name = plugin.join('.').trim().slice(0,-2);
        delete plugin;

        let arr = this.get_plugins();
        if (arr.indexOf(plugin_name) === -1){
            arr.push(plugin_name)
            this.set_plugins(arr);
        }

        this.set_plugin(base64, plugin_name);
        alert('Plugin installed!');

    },

    getBase64 : function (file) {
        let file_name = file.name;
        let reader = new FileReader();
        reader.file_name = file_name;
        reader.readAsDataURL(file);
        reader.onload = function () {
           plugin_manager.install_plugin(reader.result, reader.file_name);
        };
        return reader.result;
        reader.onerror = function (error) {
          console.log('Error: ', error);
        };
     }
}

const commands_functions = {
    define : function (){
        let val = input.value.split(' ');

        localStorage['var-' + val[1]] = val[2];


        let arr;
        if (localStorage['defined'] !== undefined) {arr = JSON.parse(localStorage['defined']);}
        else {arr = [];}
        if(arr.indexOf(val[1])){
            arr.push(val[1]);
            localStorage['defined'] = JSON.stringify(arr);
        }
        else{
            return;
        }
    },

    open : function(){
        let val = input.value.split(' ');
        if (val[2] === "true"){
            window.open(val[1], '_blank');
        }
        else {
            window.location.href = val[1];
        }
    },

    s : function(){
        let val = input.value.split(' ');
        delete val[0];
        search = val.join(' ');
        window.location.href = `https://www.google.com/search?q=${encodeURI(search)}`;
    },

    config: function(){
        visual_menu.innerHTML = config_page;
        let plugin_list = document.getElementById('plugins_list');
        plugin_list.value = plugin_manager.get_plugins().join('\n');
        plugin_list.oninput = () => {
            let plugins = document.getElementById('plugins_list').value.trim().split('\n');
            plugins = plugins.filter(plugin => plugin !== "");
            plugin_manager.set_plugins(plugins);
            alert('plugin list is updated!');
        }
    }
}







let commands = Object.keys(commands_functions);
let current_commands_array = commands;
function search_in_commands(arr, str){
    let result_arr = [];
    let search = (str1, str2) => {
        for (let i = 0; i < str2.length; i++) {
            if (str1[i] !== str2[i]){return false;}
        }
        return true;
    }
    for (let i = 0; i < arr.length; i++) {
        if (search(arr[i], str)){
            result_arr.push(arr[i]);
        }
    }
    return result_arr;
}

function exec_command(){
    let val = input.value.split(' ');
    if (commands.indexOf(val[0]) === -1){
        if (localStorage['var-' + val[0]] !== undefined){
            window.location.href = localStorage['var-' + val[0]];
        }
    }
    else {
        commands_functions[val[0]]();
    }
    input.value = '';
    return false;
}

function rewrite_command_completer(){
    let arr = current_commands_array;
    let c = "";
    for (let i = 0; i < arr.length; i++){
        if (i === index){
            c = c + `<span id='selected'>${arr[i]}</span><br>`;
        }
        else {
            c = c + `${arr[i]}<br>`;
        }
        
    }

    if (localStorage['defined'] !== undefined) {arr = JSON.parse(localStorage['defined']);}
    else {arr = [];}
    command_completer.innerHTML = c;
    c = "";
    for (i = 0; i < arr.length; i++){
            c = c + `<span onclick="clicker(this)">${arr[i]}</span><br>`; 
    }
    defined_links.innerHTML = c;
}

function handle_tab(e){
    pressed[e.code] = true;
    let elem = e.srcElement;
    if (pressed["ControlLeft"]){
        let val = input.value.split(' ');
        val[0] = current_commands_array[index];
        let command = val.join(' ');
        elem.value = command;
        return;


    }
    if (pressed["Tab"] && pressed["ShiftLeft"]){
        if (index > 0){index -= 1}
        else {index = current_commands_array.length - 1;}
        rewrite_command_completer();
        return false;
    }
    else if (pressed["Tab"]){
        if (index <= current_commands_array.length - 2){index += 1;}
        else{index = 0;}
        
        rewrite_command_completer();
        return false;
    }
    //return false;
}

function unhandle_tab(e){
    pressed[e.code] = false;
}

function analyser(e){
    let val = e.srcElement.value;
    let formated_val = val.split(' ');
    current_commands_array = search_in_commands(commands, formated_val[0]);
    rewrite_command_completer();
    // console.log(val);
    
}

form.onsubmit = exec_command;
input.onkeydown = handle_tab;
input.onkeyup = unhandle_tab;
input.oninput = analyser;
document.querySelector('html').onkeyup = () => {input.focus();}
document.querySelector('html').onclick = () => {input.focus();}

input.focus();
rewrite_command_completer();


function clicker(th){
    window.location.href = localStorage[`var-${th.innerHTML}`];
}

init()
