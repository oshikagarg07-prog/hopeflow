var express=require("express");

var app=express();

app.listen(2007,function(){
    console.log("server started");
})

app.use(express.static("public"));
app.use("/pics", express.static(__dirname + "/pics"));

app.get("/",function(req,resp){
    var path=__dirname+"/index.html";
    resp.sendFile(path);
})

//----------------------------------------------------------
app.use(express.urlencoded(true));
app.get("/signup-process",function(req,resp){
    
    let email=req.query.txtEmail;
    let pwd=req.query.txtPwd;
    let usertype=req.query.utype;
    
    mysqlCon.query("select * from userspro where emailid=?",[email],function(err,result){
        if(result.length==1)
        {
            resp.send("Already registered!");
        }
        else 
        {
            mysqlCon.query("insert into userspro values(?,?,?,current_date,1)",[email,pwd,usertype],function(err){
               if(err==null)
                  resp.send("Signed in Successfully!");
               else
                  resp.send(err.message);
            })
        }
    })

})

//---------------------Cloudinary------------------------------
var fileuploader=require("express-fileupload");
app.use(fileuploader());
var cloudinary=require("cloudinary").v2;
var mysql=require("mysql2");
require('dotenv').config();

cloudinary.config({ 
            cloud_name:process.env.CLOUD_NAME, 
            api_key:process.env.CLOUD_API, 
            api_secret:process.env.CLOUD_KEY // Click 'View API Keys' above to copy your API secret
        });

//----------------------Mysql--------------------------------------
let url=process.env.AIVEN_URL;

const mysql= mysql.createPool(
    {
        uri: url,
        dateStrings: true,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

//-------------------Login check----------------------------------
app.get("/login-process",function(req,resp){
    let email=req.query.txtEmail2;
    let pwd=req.query.txtPwd2;
    mysqlCon.query("select * from userspro where emailid=? and pwd=?",[email,pwd],function(err,resultJSONAry){
        if(err==null)
        {
            if(resultJSONAry.length==1)
                    resp.send(resultJSONAry[0].utype);
        
            else 
                resp.send("Invalid email or password.")
        }
        else 
            resp.send(err.message);
    })
})

//------------------------------------------------------------------------------------------
app.get("/check-email-signup",function(req,resp){
    let email=req.query.txtEmail;
    mysqlCon.query("select * from userspro where emailid=?",[email],function(err,resultJSONAry){
        if(err==null)
        {
            if(resultJSONAry.length==1)
                resp.send("Already Occupied");
            else
                resp.send("Valid");
        }
        else
            resp.send(err.message);
    })
})

//----------------------------Donor-----------------------
app.get("/donor-profile",function(req,resp){
    var path=__dirname+"/public/donor-profile.html";
    resp.sendFile(path);
})

//-------------------------Donor MySQL------------------------
app.post("/donor-submit", async function (req, resp) {

    let email = req.body.txtEmail;
    let fname = req.body.txtFName;
    let lname = req.body.txtLName;
    let mobile = req.body.txtMobile;
    let address = req.body.txtAddress;
    let city = req.body.txtCity;

    let Amsg = "File Not Uploaded!";
    let myAdharUrl = "no-url";

    if (req.files != null) {
        let AfileName = req.files.acardPic.name;
        let fullPath = __dirname + "/uploads/" + AfileName;
        await req.files.acardPic.mv(fullPath);
        Amsg = "File Uploaded Successfully";

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            myAdharUrl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myAdharUrl);
        });
    }

    let Pmsg = "File Not Uploaded!";
    let myProfileUrl = "no-url";

    if (req.files != null) {
        let PfileName = req.files.profilePic.name;
        let fullPath = __dirname + "/uploads/" + PfileName;
        await req.files.profilePic.mv(fullPath);
        Amsg = "File Uploaded Successfully";

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            myProfileUrl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myProfileUrl);
        });
    }


    mysqlCon.query("insert into dprofile values(?,?,?,?,?,?,?,?)", [email, fname, lname, mobile, address, city, myAdharUrl, myProfileUrl], function (err) {
        if (err == null)
            resp.send("Record Saved Successfully");
        else
            resp.send(err.message);
    })
})


//-----------------------------Get Data--------------------------

app.get("/get-data",function(req,resp){
    let email=req.query.emailKuch;
    mysqlCon.query("select * from dprofile where emailid=?",[email],function(err,resultJSONAry){
        if(err==null){
            resp.send(resultJSONAry);
            return;
        }
        if(resultJSONAry.length==0){
            resp.send("Invalid Email Id");
            return;
        }
        else 
            resp.send(err.message);
    })
})

//-------------------------Donor Update---------------------------
app.post("/donor-profile-update",async function(req,resp){
    let email=req.body.txtEmail;
   let fname=req.body.txtFName;
   let lname=req.body.txtLName;
   let mobile=req.body.txtMobile;
   let address=req.body.txtAddress;
   let city=req.body.txtCity;
    
    let Amsg="File Not Uploaded!";
    let myAdharUrl="no-url";

    if(req.files!=null){
    let AfileName=req.files.acardPic.name;
    let fullPath=__dirname+"/uploads/"+AfileName;
    await req.files.acardPic.mv(fullPath);
    Amsg="File Uploaded Successfully";

    await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myAdharUrl=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myAdharUrl);
      });
 }

    let Pmsg="File Not Uploaded!";
    let myProfileUrl="no-url";

    if(req.files!=null){
    let PfileName=req.files.profilePic.name;
    let fullPath=__dirname+"/uploads/"+PfileName;
    await req.files.profilePic.mv(fullPath);
    Pmsg="File Uploaded Successfully";

    await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myProfileUrl=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myProfileUrl);
      });
 }

    mysqlCon.query("update dprofile set fname=?,lname=?,mobile=?,address=?,city=?,acardpath=?,picpath=? where emailid=?",[fname,lname,mobile,address,city,myAdharUrl,myProfileUrl,email],function(err){
    if(err==null)
        resp.send("Record Updated Successfully");
    else 
        resp.send(err.message);
   })
})

//-------------------------Avail Medicine-----------------------------
app.get("/availmed",function(req,resp){
    var path=__dirname+"/public/availmed.html";
    resp.sendFile(path);
})

//-----------------------Avail Med MySQL------------------------------
app.post("/avail-med-btn",async function(req,resp){
    let email=req.body.txtEmail;
    let medname=req.body.txtMed;
    let expdate=req.body.txtExp;
    let company=req.body.txtCompany;
    let qty=req.body.txtQty;
    let info=req.body.txtInfo;
    let pack=req.body.txtPack;
    
    let msg="File Not Uploaded!";
    let myUrl="no-url";

    if(req.files!=null){
    let fileName=req.files.medPic.name;
    let fullPath=__dirname+"/uploads/"+fileName;
    await req.files.medPic.mv(fullPath);
    msg="File Uploaded Successfully";

    await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myUrl=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myUrl);
      });
    }

   mysqlCon.query("insert into medicines(emailid,medname,expdate,company,qty,info,picurl,packing) values(?,?,?,?,?,?,?,?)",[email,medname,expdate,company,qty,info,myUrl,pack],function(err){
    if(err==null)
        resp.send("Record Saved Successfully!");
    else 
        resp.send(err.message);
   })
})
//--------------------------------Avail Equipment------------------------
app.get("/avail-equip",function(req,resp){
    var path=__dirname+"/public/avail-equip.html";
    resp.sendFile(path);
})

//--------------------------------Avail Equip MySQL-----------------------
app.post("/avail-equip-submit-btn",async function(req,resp){
    let email=req.body.txtEmail;
   let type=req.body.txtType;
   let cond=req.body.selCond;
   let radio=req.body.radio;
   let info=req.body.txtInfo;
    
    let pic1msg="File Not Uploaded!";
    let myPic1Url="no-url";

    if(req.files!=null){
    let pic1fileName=req.files.pic1.name;
    let fullPath=__dirname+"/uploads/"+pic1fileName;
    await req.files.pic1.mv(fullPath);
    pic1msg="File Uploaded Successfully";

    await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myPic1Url=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myPic1Url);
      });
 }

    let pic2msg="File Not Uploaded!";
    let myPic2Url="no-url";

    if(req.files!=null){
    let pic2fileName=req.files.pic2.name;
    let fullPath=__dirname+"/uploads/"+pic2fileName;
    await req.files.pic2.mv(fullPath);
    pic2msg="File Uploaded Successfully";

    await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myPic2Url=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myPic2Url);
      });
 }

   mysqlCon.query("insert into equipments(emailid,equipment,equipcondition,equiptype,pic1url,pic2url,info) values(?,?,?,?,?,?,?)",[email,type,cond,radio,myPic1Url,myPic2Url,info],function(err){
    if(err==null)
        resp.send("Record Saved Successfully");
    else 
        resp.send(err.message);
   })
})

//-------------------------angular-admin-user-dash--------------------

app.get("/angular-admin-user",function(req,resp){
    var path=__dirname+"/public/admin-user-dash.html";
    resp.sendFile(path);
})

app.get("/fetch-userdata",function(req,resp){
    mysqlCon.query("Select * from userspro",function(err,resultJSONAry){
        if(err==null)
        {
            //console.log(resultJSONAry)
            resp.send(resultJSONAry);
        }
        else 
            resp.send(err.message);
    })
})

app.get("/do-delete",function(req,resp){
    let email=req.query.emailKeyKuch;
    mysqlCon.query("delete from userspro where emailid=?",[email],function(err,result){
        if(err==null)
        {
            if(result.affectedRows==1)
                resp.send("Record Deleted Successfully");
            else
                resp.send("Invalid Email Id");
        }
        else
            resp.send(err.message);
    })
})

app.get("/block-user",function(req,resp){
    let email=req.query.emailKeyKuch;
    mysqlCon.query("update userspro set statas=0 where emailid=?",[email],function(err,result){
        if(err==null)
        {
            if(result.affectedRows==1)
                resp.send("User Blocked");
            else
                resp.send("Invalid Email Id");
        }
        else
            resp.send(err.message);
    })
})

app.get("/resume-user",function(req,resp){
    let email=req.query.emailKeyKuch;
    mysqlCon.query("update userspro set statas=1 where emailid=?",[email],function(err,result){
        if(err==null)
        {
            if(result.affectedRows==1)
                resp.send("You can now resume");
            else
                resp.send("Invalid Email Id");
        }
        else
            resp.send(err.message);
    })
})

//----------------------Angular-admin-donor-dash-------------------
app.get("/angular-admin-donor",function(req,resp){
    var path=__dirname+"/public/admin-donor-dash.html";
    resp.sendFile(path);
})

app.get("/fetch-donor",function(req,resp){
    mysqlCon.query("select * from dprofile",function(err,resultJSONAry){
        if(err==null)
            resp.send(resultJSONAry);
        else 
            resp.send(err.message);
    })
})

app.get("/donor-delete",function(req,resp){
    let email=req.query.emailKeyKuch;
    mysqlCon.query("delete from dprofile where emailid=?",[email],function(err,result){
        if(err==null)
        {
            if(result.affectedRows==1)
                resp.send("Record Deleted Successfully");
            else
                resp.send("Invalid Email Id");
        }
        else
            resp.send(err.message);
    })
})
//----------------------Angular-admin-ngo-dash--------------------
app.get("/angular-admin-ngo",function(req,resp){
    var path=__dirname+"/public/admin-ngo-dash.html";
    resp.sendFile(path);
})

app.get("/fetch-ngodata",function(req,resp){
    mysqlCon.query("Select * from ngos",function(err,resultJSONAry){
        if(err==null)
        {
            //console.log(resultJSONAry)
            resp.send(resultJSONAry);
        }
        else 
            resp.send(err.message);
    })
})

//----------------------Angular-admin-needy-dash--------------------
app.get("/angular-admin-ngo",function(req,resp){
    var path=__dirname+"/public/admin-needy-dash.html";
    resp.sendFile(path);
})

app.get("/fetch-needydata",function(req,resp){
    mysqlCon.query("Select * from needyprofile",function(err,resultJSONAry){
        if(err==null)
        {
            //console.log(resultJSONAry)
            resp.send(resultJSONAry);
        }
        else 
            resp.send(err.message);
    })
})

//--------------------------dash-donor-fetch------------------------
app.get("/angular-dash-donor",function(req,resp){
    var path=__dirname+"/public/dash-donor.html";
    resp.sendFile(path);
})

app.get("/fetch-med",function(req,resp){
    let email = req.query.emailidKuch;
    mysqlCon.query("select * from medicines where emailid=?",[email],function (err, resultJSONAry){
            if (err==null){
                if(resultJSONAry.length==0){
                    resp.send("Invalid Email Id");
                    return;
                }
                resp.send(resultJSONAry);
                return;
            }
            resp.send(err.message);   
     })
})

app.get("/do-delete-med",function(req,resp){
    let rid=req.query.ridKuch;
    mysqlCon.query("delete from medicines where rid=?",[rid],function(err,result){
        if(err==null)
        {
            if(result.affectedRows==1)
                resp.send("Record Deleted Successfully");
            else
                resp.send("Invalid Email Id");
        }
        else
            resp.send(err.message);
    })
})

app.get("/update-pwd",function(req,resp){
    let email=req.query.emailidKuch;
    let oldpwd=req.query.oldpwdKuch;
    let newpwd=req.query.newpwdKuch;
    mysqlCon.query("update userspro set pwd=? where emailid=? and pwd=?",[newpwd,email,oldpwd],function(err,result){
        if(err==null)
        {
            if(result.affectedRows==1)
                resp.send("Updated Successfully");
            else
                resp.send("Invalid Email Id");
        }
        else
            resp.send(err.message);
    })
})

app.get("/fetch-equip",function(req,resp){
    let email = req.query.emailidEquip;
    mysqlCon.query("select * from equipments where emailid=?",[email],function (err, resultJSONAry){
            if (err==null){
                if(resultJSONAry.length==0){
                    resp.send("Invalid Email Id");
                    return;
                }
                resp.send(resultJSONAry);
                return;
            }
            resp.send(err.message);   
     })
})

app.get("/do-delete-equip",function(req,resp){
    let rid=req.query.ridKuch;
    mysqlCon.query("delete from equipments where rid=?",[rid],function(err,result){
        if(err==null)
        {
            if(result.affectedRows==1)
                resp.send("Record Deleted Successfully");
            else
                resp.send("Invalid Email Id");
        }
        else
            resp.send(err.message);
    })
})

app.get("/show-all-equip",function(req,resp){
    mysqlCon.query("select * from equipments",function(err,result){
        if(err==null)
        {
            resp.send(result);
            //console.log(resp.data);
        }
        else
            resp.send(err.message);
    })
})

//--------------------dash-admin-----------------------
app.get("/angular-dash-admin",function(req,resp){
    var path=__dirname+"/public/dash-admin.html";
    resp.sendFile(path);
})

app.get("/fetch-in-city-med",function(req,resp){
    let city=req.query.city;
     mysqlCon.query("select m.* from medicines m inner join dprofile d on m.emailid=d.emailid where d.city=?",[city],function(err,resultJSONAry) {
        if(err==null)
              {
                //console.log(resultJSONAry);
                resp.send(resultJSONAry);
                
              }
        else
                resp.send(err.message);
    })
})

app.get("/show-all-med",function(req,resp){
    mysqlCon.query("select * from medicines",function(err,result){
        if(err==null)
        {
            resp.send(result);
            //console.log(resp.data);
        }
        else
            resp.send(err.message);
    })
})

//-------------------Med Finder------------------------
//app.get("/angular-med-finder",function(req,resp){
    //var path=__dirname+"/public/medFinder.html";
    //resp.sendFile(path);
//})

app.get("/fetch-distinct-cities",function(req,resp)
{
    mysqlCon.query("select distinct city from dprofile ",function(err,resultJSONAry){
        if(err==null)
        {
            //console.log(resultJSONAry)
            resp.send(resultJSONAry)
        }
        else
             resp.send(err.message);
    })
})

app.get("/fetch-distinct-med", function (req, resp) {

    let city = req.query.cityKuch;
    let med = req.query.medKuch;

    mysqlCon.query(
        `SELECT m.* FROM medicines m INNER JOIN dprofile d ON m.emailid = d.emailid WHERE d.city = ? AND m.medname = ?`, [city, med], function (err, result) {
            if (err == null)
                resp.send(result);
            else
                resp.send(err.message);
        })
})

app.get("/donor-contact-details",function(req,resp){
    let email=req.query.emailKuch;
    console.log(email);
    mysqlCon.query("select * from dprofile where emailid=?",[email],function(err,result){
        if(err==null)
        {
            resp.send(result);
            //console.log(resp.data);
        }
        else
            resp.send(err.message);
    })
})

//---------------------Equip-Finder---------------------
app.get("/angular-equip-finder",function(req,resp){
    var path=__dirname+"/public/equipFinder.html";
    resp.sendFile(path);
})

app.get("/fetch-distinct-needy-cities",function(req,resp)
{
    mysqlCon.query("select distinct city from needyprofile ",function(err,resultJSONAry){
        if(err==null)
        {
            //console.log(resultJSONAry)
            resp.send(resultJSONAry)
        }
        else
             resp.send(err.message);
    })
})

app.get("/fetch-in-city-equip",function(req,resp){
    let city=req.query.city;
     mysqlCon.query("SELECT e.* FROM equipments e INNER JOIN dprofile d ON e.emailid=d.emailid where d.city=?",[city],function(err,resultJSONAry) {
        if(err==null)
              {
                //console.log(resultJSONAry);
                resp.send(resultJSONAry);
                
              }
        else
                resp.send(err.message);
    })
})

app.get("/fetch-distinct-equip", function (req, resp) {

    let city = req.query.cityKuch;
    let equip = req.query.equipKuch;

    mysqlCon.query(
        `SELECT e.* FROM equipments e INNER JOIN dprofile d ON e.emailid = d.emailid WHERE d.city = ? AND e.equipment = ?`, [city, equip], function (err, result) {
            if (err == null)
                resp.send(result);
            else
                resp.send(err.message);
        })
})

//------------------------NGO-Registration-----------------
app.get("/ngo-registration",function(req,resp){
    var path=__dirname+"/public/ngo-registration.html";
    resp.sendFile(path);
})

//-------------------------NGOS MySQL------------------------
app.post("/ngo-register-btn", async function (req, resp) {

    let email = req.body.txtEmail;
    let name = req.body.txtName;
    let regoffice = req.body.txtOffice;
    let city = req.body.txtCity;
    let web = req.body.txtWeb;
    let contact = req.body.txtContact;
    let since = req.body.txtSince;
    let chairperson = req.body.txtPerson;
    let profile = req.body.txtProfile;
    let regno = req.body.txtReg;

    let msg = "File Not Uploaded!";
    let myUrl = "nopic.jpg";

    if (req.files != null) {
        let fileName = req.files.medPic.name;
        let fullPath = __dirname + "/uploads/" + fileName;
        await req.files.medPic.mv(fullPath);
        msg = "File Uploaded Successfully";

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            myUrl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myUrl);
        });
    }

    mysqlCon.query("insert into ngos values(?,?,?,?,?,?,?,?,?,?,?)", [email, name, regoffice, city, web, contact, since, chairperson, profile, regno, myUrl], function (err) {
        if (err == null)
            resp.send("Record Saved Successfully");
        else
            resp.send(err.message);
    })
})

//-------------------NGO-Finder------------------------
app.get("/ngo-finder",function(req,resp){
    var path=__dirname+"/public/NGO-finder.html";
    resp.sendFile(path);
})

app.get("/fetch-ngo-city",function(req,resp){
    mysqlCon.query("select distinct city from ngos ",function(err,resultJSONAry){
        if(err==null)
        {
            //console.log(resultJSONAry)
            resp.send(resultJSONAry)
        }
        else
             resp.send(err.message);
    })
})

app.get("/find-ngo",function(req,resp){
    let city=req.query.city;
    mysqlCon.query("select * from ngos where city=?",[city],function(err,result){
        if(err==null)
            resp.send(result);
        else
            resp.send(err.message);
    })
})

//----------------------Needy Profile--------------------------
app.get("/needy-profile",function(req,resp){
    var path=__dirname+"/public/needy-profile.html";
    resp.sendFile(path);
})

app.post("/needy-profile-submit", async function (req, resp) {

    let email = req.body.txtEmail;
    let fname = req.body.txtFName;
    let lname = req.body.txtLName;
    let mobile = req.body.txtMobile;
    let address = req.body.txtAddress;
    let city = req.body.txtCity;

    let Amsg = "File Not Uploaded!";
    let myAdharUrl = "nopic.jpg";

    if (req.files != null) {
        let AfileName = req.files.acardPic.name;
        let fullPath = __dirname + "/uploads/" + AfileName;
        await req.files.acardPic.mv(fullPath);
        Amsg = "File Uploaded Successfully";

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            myAdharUrl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myAdharUrl);
        });
    }

    let Pmsg = "File Not Uploaded!";
    let myProfileUrl = "no-url";

    if (req.files != null) {
        let PfileName = req.files.profilePic.name;
        let fullPath = __dirname + "/uploads/" + PfileName;
        await req.files.profilePic.mv(fullPath);
        Amsg = "File Uploaded Successfully";

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            myProfileUrl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myProfileUrl);
        });
    }


    mysqlCon.query("insert into needyprofile values(?,?,?,?,?,?,?,?)", [email, fname, lname, mobile, address, city, myAdharUrl, myProfileUrl], function (err) {
        if (err == null)
            resp.send("Record Saved Successfully");
        else
            resp.send(err.message);
    })
})

//-------------------------Needy Update---------------------------
app.post("/needy-profile-update",async function(req,resp){
    let email=req.body.txtEmail;
   let fname=req.body.txtFName;
   let lname=req.body.txtLName;
   let mobile=req.body.txtMobile;
   let address=req.body.txtAddress;
   let city=req.body.txtCity;
    
    let Amsg="File Not Uploaded!";
    let myAdharUrl="nopic.jpg";

    if(req.files!=null){
    let AfileName=req.files.acardPic.name;
    let fullPath=__dirname+"/uploads/"+AfileName;
    await req.files.acardPic.mv(fullPath);
    Amsg="File Uploaded Successfully";

    await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myAdharUrl=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myAdharUrl);
      });
 }

    let Pmsg="File Not Uploaded!";
    let myProfileUrl="no-url";

    if(req.files!=null){
    let PfileName=req.files.profilePic.name;
    let fullPath=__dirname+"/uploads/"+PfileName;
    await req.files.profilePic.mv(fullPath);
    Pmsg="File Uploaded Successfully";

    await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myProfileUrl=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myProfileUrl);
      });
 }

    mysqlCon.query("update needyprofile set fname=?,lname=?,mobile=?,address=?,city=?,acardpath=?,picpath=? where emailid=?",[fname,lname,mobile,address,city,myAdharUrl,myProfileUrl,email],function(err){
    if(err==null)
        resp.send("Record Updated Successfully");
    else 
        resp.send(err.message);
   })
})

//-----------------Needy Dashboard-------------------------
app.get("/angular-dash-needy",function(req,resp){
    var path=__dirname+"/public/dash-needy.html";
    resp.sendFile(path);
})

app.get("/angular-dash-ngo",function(req,resp){
    var path=__dirname+"/public/dash-ngo.html";
    resp.sendFile(path);
})