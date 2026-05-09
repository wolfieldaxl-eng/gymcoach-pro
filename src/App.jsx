import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";

import { auth } from './firebase'
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};



const db = getFirestore();
const COACH_EMAIL = "coach@gymcoach.com";

const C = {
  bg:"#0f0f0f",surface:"#1a1a1a",card:"#222",border:"#2e2e2e",
  accent:"#f97316",accentMuted:"#7c3a12",text:"#f5f5f5",muted:"#666",
  green:"#22c55e",greenMuted:"#14532d",red:"#ef4444",redMuted:"#450a0a",
  yellow:"#eab308",yellowMuted:"#713f12",
};

const DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const todayIdx = new Date().getDay()===0?6:new Date().getDay()-1;
const SURVEY = [
  {id:"q3",q:"¿Cómo te sentiste esta semana?",type:"scale5",labels:["Muy mal","Mal","Regular","Bien","Excelente"]},
  {id:"q4",q:"Motivación para entrenar",type:"scale5",labels:["Sin motivación","Poca","Neutral","Motivado","Muy motivado"]},
  {id:"q5",q:"Calidad del sueño",type:"scale5",labels:["Muy mala","Mala","Regular","Buena","Excelente"]},
  {id:"q6",q:"Nivel de estrés",type:"scale5",labels:["Sin estrés","Poco","Moderado","Alto","Muy alto"]},
  {id:"q7",q:"Rendimiento en entrenamientos",type:"scale5",labels:["Muy bajo","Bajo","Normal","Alto","Máximo"]},
  {id:"q8",q:"¿Completaste tus entrenamientos?",type:"opts",opts:["Sí, todos","La mayoría","La mitad","Pocos","Ninguno"]},
  {id:"q9",q:"Dificultad de la semana (esfuerzo)",type:"scale5",labels:["Muy fácil","Fácil","Moderado","Difícil","Muy difícil"]},
  {id:"q10",q:"Nivel de fatiga",type:"scale5",labels:["Sin fatiga","Poca","Moderada","Alta","Agotado"]},
  {id:"q11",q:"Molestias o dolor",type:"opts",opts:["Sin molestias","Leve","Moderado","Fuerte","Lesión"]},
  {id:"q12",q:"Seguimiento del entrenamiento",type:"opts",opts:["100%","75%","50%","25%","0%"]},
  {id:"q13",q:"Seguimiento de alimentación",type:"opts",opts:["Perfecto","Muy bien","Regular","Mal","Muy mal"]},
  {id:"q14",q:"Hidratación",type:"opts",opts:["+3L diarios","2-3L","1-2L","Menos de 1L","Casi nada"]},
  {id:"q15",q:"Esta semana…",type:"opts",opts:["Me superé","Cumplí lo esperado","Hice lo mínimo","Tuve dificultades","Fue muy dura"]},
  {id:"q16",q:"¿Cómo fue tu semana en general?",type:"opts",opts:["Excelente 💪","Muy buena","Buena","Regular","Difícil"]},
];
const SCORE_MAP = {
  q3:{scale:true,invert:false},q4:{scale:true,invert:false},q5:{scale:true,invert:false},
  q6:{scale:true,invert:true},q7:{scale:true,invert:false},
  q8:{opts:["Sí, todos","La mayoría","La mitad","Pocos","Ninguno"],scores:[5,4,3,2,1]},
  q9:{scale:true,invert:true},q10:{scale:true,invert:true},
  q11:{opts:["Sin molestias","Leve","Moderado","Fuerte","Lesión"],scores:[5,4,3,2,1]},
  q12:{opts:["100%","75%","50%","25%","0%"],scores:[5,4,3,2,1]},
  q13:{opts:["Perfecto","Muy bien","Regular","Mal","Muy mal"],scores:[5,4,3,2,1]},
  q14:{opts:["+3L diarios","2-3L","1-2L","Menos de 1L","Casi nada"],scores:[5,4,3,2,1]},
  q15:{opts:["Me superé","Cumplí lo esperado","Hice lo mínimo","Tuve dificultades","Fue muy dura"],scores:[5,4,3,2,1]},
  q16:{opts:["Excelente 💪","Muy buena","Buena","Regular","Difícil"],scores:[5,4,3,2,1]},
};

function analyzeLoad(ans) {
  if(!ans||Object.keys(ans).length===0) return null;
  let score=0,count=0;
  Object.entries(SCORE_MAP).forEach(([key,cfg])=>{
    const val=ans[key];
    if(val===undefined||val===null) return;
    if(cfg.scale){score+=(cfg.invert?5-val:val+1);count++;}
    else{const idx=cfg.opts.indexOf(val);if(idx>=0){score+=cfg.scores[idx];count++;}}
  });
  if(count===0) return null;
  const avg=score/count; const s=Math.round(avg*10)/10;
  if(avg>=3.8) return {label:"Subir peso 📈",color:C.green,bg:C.greenMuted,desc:"El cliente responde bien. Incrementa la carga.",score:s};
  if(avg>=2.5) return {label:"Mantener 🔁",color:C.yellow,bg:C.yellowMuted,desc:"Semana estable. Conserva la carga actual.",score:s};
  return {label:"Deload 📉",color:C.red,bg:C.redMuted,desc:"Fatiga o bajo rendimiento. Reduce la carga.",score:s};
}

const inp={background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,padding:"8px 12px",width:"100%",boxSizing:"border-box",outline:"none"};
const btnS=(v="primary")=>({background:v==="primary"?C.accent:v==="red"?C.red:"transparent",color:v==="outline"?C.accent:"#fff",border:`1px solid ${v==="outline"?C.accent:v==="red"?C.red:C.accent}`,borderRadius:8,padding:"10px 16px",fontSize:13,fontWeight:500,cursor:"pointer",width:"100%"});
const cardS={background:C.card,borderRadius:12,border:`1px solid ${C.border}`,padding:"14px 16px",marginBottom:12};
const navBtn=(a)=>({flex:1,padding:"12px 4px",background:"transparent",border:"none",color:a?C.accent:C.muted,fontSize:10,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4});
const subTab=(a)=>({flex:1,padding:"11px 0",background:"transparent",border:"none",borderBottom:a?`2px solid ${C.accent}`:"2px solid transparent",color:a?C.accent:C.muted,fontSize:10,fontWeight:500,cursor:"pointer"});
const avS={width:42,height:42,borderRadius:"50%",background:C.accentMuted,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:C.accent,flexShrink:0};

function Spinner(){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:C.bg}}>
      <div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.accent}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function EditClientScreen({client,onSave,onCancel}){
  const [f,setF]=useState({name:client.name,goal:client.goal,weight:client.weight,kcalGoal:client.kcalGoal});
  return(
    <div style={{background:C.bg,minHeight:"100vh",maxWidth:390,margin:"0 auto",fontFamily:"system-ui,sans-serif",color:C.text}}>
      <div style={{background:C.surface,padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}><div style={{fontSize:15,fontWeight:600}}>Editar cliente</div></div>
      <div style={{padding:16}}>
        {[["Nombre","name","text"],["Objetivo","goal","text"],["Peso (kg)","weight","number"],["Meta kcal/día","kcalGoal","number"]].map(([lbl,key,type])=>(
          <div key={key} style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{lbl}</div>
            <input style={inp} type={type} value={f[key]} onChange={e=>setF(p=>({...p,[key]:type==="number"?+e.target.value:e.target.value}))} />
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button style={{...btnS("primary"),flex:1}} onClick={()=>onSave(f)}>Guardar</button>
          <button style={{...btnS("outline"),flex:1}} onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function SurveyQuestion({item,value,onChange}){
  const {id,q,type,labels,opts}=item;
  return(
    <div style={{marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:500,marginBottom:8,color:value!==undefined?C.text:C.muted}}>
        {q}{value!==undefined&&<span style={{color:C.green,marginLeft:6,fontSize:11}}>✓</span>}
      </div>
      {type==="scale5"&&(
        <div>
          <div style={{display:"flex",gap:5}}>
            {[0,1,2,3,4].map(n=>(
              <button key={n} onClick={()=>onChange(id,n)} style={{flex:1,padding:"10px 0",borderRadius:8,border:`1px solid ${value===n?C.accent:C.border}`,background:value===n?C.accentMuted:"transparent",color:value===n?C.accent:C.muted,fontSize:14,fontWeight:600,cursor:"pointer"}}>{n+1}</button>
            ))}
          </div>
          {labels&&<div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted,marginTop:4}}><span>{labels[0]}</span><span>{labels[4]}</span></div>}
        </div>
      )}
      {type==="opts"&&(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {opts.map(o=>(
            <button key={o} onClick={()=>onChange(id,o)} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${value===o?C.accent:C.border}`,background:value===o?C.accentMuted:"transparent",color:value===o?C.accent:C.muted,fontSize:12,cursor:"pointer",textAlign:"left"}}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function KcalEditor({kcal,goal,onSave}){
  const [editing,setEditing]=useState(null);
  const [temp,setTemp]=useState("");
  return(
    <>
      {DAYS.map((day,i)=>{
        const val=kcal[i]||0;const p=val>0?(val/goal)*100:0;const isToday=i===todayIdx;
        return(
          <div key={day} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,fontWeight:isToday?600:400,color:isToday?C.accent:C.text}}>{day}{isToday&&<span style={{fontSize:10,color:C.accent}}> · hoy</span>}</div>
              {editing===i?(
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <input style={{...inp,width:90,padding:"4px 8px"}} type="number" value={temp} onChange={e=>setTemp(e.target.value)} autoFocus />
                  <button onClick={()=>{onSave(i,parseInt(temp)||0);setEditing(null);}} style={{background:C.accent,border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer"}}>✓</button>
                </div>
              ):(
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:12,color:val>0?C.text:C.muted}}>{val>0?`${val} kcal`:"—"}</span>
                  <button onClick={()=>{setEditing(i);setTemp(val||"");}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"2px 8px",fontSize:11,cursor:"pointer"}}>editar</button>
                </div>
              )}
            </div>
            <div style={{height:6,borderRadius:3,background:C.border,position:"relative",overflow:"hidden",marginTop:6}}>
              <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${Math.min(p,100)}%`,background:p>100?C.red:p>80?C.green:C.accent,borderRadius:3}}/>
            </div>
            {val>0&&<div style={{fontSize:10,color:C.muted,marginTop:2,textAlign:"right"}}>{Math.round(p)}% de la meta</div>}
          </div>
        );
      })}
    </>
  );
}

export default function App(){
  const [authUser,setAuthUser]=useState(null);
  const [loading,setLoading]=useState(true);
  const [isCoach,setIsCoach]=useState(false);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loginError,setLoginError]=useState("");
  const [loginLoading,setLoginLoading]=useState(false);
  const [clients,setClients]=useState([]);
  const [selClient,setSelClient]=useState(null);
  const [clientTab,setClientTab]=useState("rutina");
  const [tab,setTab]=useState("clients");
  const [editingClientId,setEditingClientId]=useState(null);
  const [showAddClient,setShowAddClient]=useState(false);
  const [newClient,setNewClient]=useState({name:"",email:"",password:"",goal:"",weight:"",kcalGoal:""});
  const [addClientError,setAddClientError]=useState("");
  const [addClientLoading,setAddClientLoading]=useState(false);
  const [myData,setMyData]=useState(null);
  const [exercises,setExercises]=useState([]);
  const [kcal,setKcal]=useState([0,0,0,0,0,0,0]);
  const [draft,setDraftState]=useState({});
  const [submitted,setSubmitted]=useState(null);
  const [surveySuccess,setSurveySuccess]=useState(false);
  const [showAddEx,setShowAddEx]=useState(false);
  const [newEx,setNewEx]=useState({name:"",sets:3,reps:10,rest:60});
  const [dataLoading,setDataLoading]=useState(false);
  const [coachPassword,setCoachPassword]=useState("");

  useEffect(()=>{
    const unsub=auth.onAuthStateChanged(async u=>{
      setAuthUser(u);
      if(u){
        const coach=u.email===COACH_EMAIL;
        setIsCoach(coach);
        if(coach) await loadClients();
        else await loadClientData(u.uid);
      }
      setLoading(false);
    });
    return unsub;
  },[]);

  async function loadClients(){
    try{
      const snap=await getDocs(collection(db,"clients"));
      setClients(snap.docs.map(d=>({id:d.id,...d.data()})));
    }catch(e){console.error(e);}
  }

  async function loadClientData(uid){
    setDataLoading(true);
    try{
      const [clientDoc,exSnap,kcalDoc,surveyDoc]=await Promise.all([
        getDoc(doc(db,"clients",uid)),
        getDocs(collection(db,"clients",uid,"exercises")),
        getDoc(doc(db,"clients",uid,"kcal","week")),
        getDoc(doc(db,"clients",uid,"survey","current")),
      ]);
      if(clientDoc.exists()) setMyData(clientDoc.data());
      setExercises(exSnap.docs.map(d=>({id:d.id,...d.data()})));
      setKcal(kcalDoc.exists()?kcalDoc.data().days:[0,0,0,0,0,0,0]);
      if(surveyDoc.exists()) setSubmitted(surveyDoc.data());
    }catch(e){console.error(e);}
    setDataLoading(false);
  }

  async function loadClientDetail(uid){
    setDataLoading(true);
    try{
      const [exSnap,kcalDoc,surveyDoc]=await Promise.all([
        getDocs(collection(db,"clients",uid,"exercises")),
        getDoc(doc(db,"clients",uid,"kcal","week")),
        getDoc(doc(db,"clients",uid,"survey","current")),
      ]);
      setExercises(exSnap.docs.map(d=>({id:d.id,...d.data()})));
      setKcal(kcalDoc.exists()?kcalDoc.data().days:[0,0,0,0,0,0,0]);
      setSubmitted(surveyDoc.exists()?surveyDoc.data():null);
    }catch(e){console.error(e);}
    setDataLoading(false);
  }

  async function handleLogin(){
    setLoginLoading(true);setLoginError("");
    try{
      await signInWithEmailAndPassword(auth,email,password);
      if(email===COACH_EMAIL) setCoachPassword(password);
    }catch(e){
      setLoginError("Email o contraseña incorrectos");
    }
    setLoginLoading(false);
  }

  async function handleLogout(){
    await signOut(auth);
    setClients([]);setMyData(null);setSelClient(null);
    setTab("clients");setEmail("");setPassword("");
  }

  async function addClient(){
    if(!newClient.name||!newClient.email||!newClient.password){setAddClientError("Nombre, email y contraseña son obligatorios");return;}
    setAddClientLoading(true);setAddClientError("");
    try{
      const {user}=await createUserWithEmailAndPassword(auth,newClient.email,newClient.password);
      const avatar=newClient.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
      const data={name:newClient.name,email:newClient.email,goal:newClient.goal||"General",weight:+newClient.weight||0,kcalGoal:+newClient.kcalGoal||2000,avatar};
      await setDoc(doc(db,"clients",user.uid),data);
      await signInWithEmailAndPassword(auth,COACH_EMAIL,coachPassword);
      setClients(p=>[...p,{id:user.uid,...data}]);
      setNewClient({name:"",email:"",password:"",goal:"",weight:"",kcalGoal:""});
      setShowAddClient(false);
    }catch(e){
      setAddClientError(e.code==="auth/email-already-in-use"?"Este email ya está registrado":"Error: "+e.message);
    }
    setAddClientLoading(false);
  }

  async function deleteClient(uid){
    try{
      await deleteDoc(doc(db,"clients",uid));
      setClients(p=>p.filter(c=>c.id!==uid));
      setSelClient(null);
    }catch(e){console.error(e);}
  }

  async function saveClientEdit(uid,fields){
    try{
      await updateDoc(doc(db,"clients",uid),fields);
      setClients(p=>p.map(c=>c.id===uid?{...c,...fields}:c));
      setEditingClientId(null);
    }catch(e){console.error(e);}
  }

  async function addExercise(){
    if(!newEx.name||!selClient) return;
    try{
      const id=Date.now().toString();
      const ex={...newEx,sets:+newEx.sets,reps:+newEx.reps,rest:+newEx.rest};
      await setDoc(doc(db,"clients",selClient,"exercises",id),ex);
      setExercises(p=>[...p,{id,...ex}]);
      setNewEx({name:"",sets:3,reps:10,rest:60});setShowAddEx(false);
    }catch(e){console.error(e);}
  }

  async function removeExercise(exId){
    try{
      await deleteDoc(doc(db,"clients",selClient,"exercises",exId));
      setExercises(p=>p.filter(e=>e.id!==exId));
    }catch(e){console.error(e);}
  }

  async function saveKcal(idx,val,uid){
    const arr=[...kcal];arr[idx]=val;setKcal(arr);
    try{await setDoc(doc(db,"clients",uid,"kcal","week"),{days:arr});}
    catch(e){console.error(e);}
  }

  async function submitSurvey(){
    if(Object.keys(draft).length===0) return;
    const data={...draft,submittedAt:new Date().toLocaleString("es-MX")};
    try{
      await setDoc(doc(db,"clients",authUser.uid,"survey","current"),data);
      setSubmitted(data);setDraftState({});setSurveySuccess(true);
      setTimeout(()=>setSurveySuccess(false),3000);
    }catch(e){console.error(e);}
  }

  function setDraft(key,val){setDraftState(p=>({...p,[key]:val}));}

  if(loading) return <Spinner/>;

  if(editingClientId){
    const ec=clients.find(c=>c.id===editingClientId);
    if(!ec){setEditingClientId(null);return null;}
    return <EditClientScreen client={ec} onSave={(f)=>saveClientEdit(editingClientId,f)} onCancel={()=>setEditingClientId(null)} />;
  }

  // LOGIN
  if(!authUser) return(
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:32,marginBottom:8}}>💪</div>
      <div style={{fontSize:20,fontWeight:600,color:C.accent,marginBottom:4}}>GymCoach Pro</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:32}}>Inicia sesión</div>
      <div style={{width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:12}}>
        <input style={inp} type="email" placeholder="Correo electrónico" value={email} onChange={e=>{setEmail(e.target.value);setLoginError("");}} />
        <input style={inp} type="password" placeholder="Contraseña" value={password} onChange={e=>{setPassword(e.target.value);setLoginError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
        {loginError&&<div style={{fontSize:12,color:C.red,textAlign:"center"}}>{loginError}</div>}
        <button onClick={handleLogin} disabled={loginLoading} style={{...btnS("primary"),opacity:loginLoading?0.6:1}}>
          {loginLoading?"Entrando...":"Entrar"}
        </button>
      </div>
    </div>
  );

  // CLIENT VIEW
  if(!isCoach){
    if(dataLoading||!myData) return <Spinner/>;
    const answeredCount=Object.keys(draft).length;
    return(
      <div style={{background:C.bg,minHeight:"100vh",maxWidth:390,margin:"0 auto",fontFamily:"system-ui,sans-serif",color:C.text}}>
        <div style={{background:C.surface,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`}}>
          <div><div style={{fontSize:15,fontWeight:600}}>{myData.name}</div><div style={{fontSize:11,color:C.muted}}>{myData.goal} · {myData.weight}kg</div></div>
          <button onClick={handleLogout} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"6px 12px",fontSize:11,cursor:"pointer"}}>Salir</button>
        </div>
        <div style={{display:"flex",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
          {["rutina","kcal","encuesta"].map(t=>(
            <button key={t} style={subTab(clientTab===t)} onClick={()=>setClientTab(t)}>
              {t==="rutina"?"Mi rutina":t==="kcal"?"Calorías":"Encuesta"+(submitted?" ✓":answeredCount>0?` (${answeredCount})`:"")}
            </button>
          ))}
        </div>
        <div style={{padding:16,paddingBottom:32}}>
          {clientTab==="rutina"&&(
            <>
              <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:500}}>Tu rutina</div>
              <div style={cardS}>
                {exercises.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:12}}>Sin ejercicios asignados aún</div>}
                {exercises.map((ex,i)=>(
                  <div key={ex.id} style={{padding:"11px 0",borderBottom:i<exercises.length-1?`1px solid ${C.border}`:"none"}}>
                    <div style={{fontSize:14,fontWeight:500}}>{ex.name}</div>
                    <div style={{display:"flex",gap:8,marginTop:5,flexWrap:"wrap"}}>
                      {[`${ex.sets} series`,`${ex.reps} reps`,ex.rest>0?`${ex.rest}s descanso`:"sin descanso"].map(lbl=>(
                        <span key={lbl} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11,padding:"2px 8px",color:C.muted}}>{lbl}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:C.accentMuted+"55",border:`1px solid ${C.accentMuted}`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.accent}}>La rutina la asigna tu entrenador. ¡Sigue el plan!</div>
            </>
          )}
          {clientTab==="kcal"&&(
            <>
              <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:500}}>Registro de calorías</div>
              <div style={{...cardS,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,color:C.muted}}>Meta diaria</span><span style={{fontSize:16,fontWeight:600,color:C.accent}}>{myData.kcalGoal} kcal</span></div></div>
              <div style={cardS}><KcalEditor kcal={kcal} goal={myData.kcalGoal} onSave={(i,v)=>saveKcal(i,v,authUser.uid)} /></div>
            </>
          )}
          {clientTab==="encuesta"&&(
            <>
              <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:500}}>Encuesta semanal</div>
              {surveySuccess&&<div style={{background:C.greenMuted,border:`1px solid ${C.green}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.green,textAlign:"center"}}>✓ Encuesta enviada</div>}
              {submitted&&(
                <div style={{background:C.greenMuted,border:`1px solid ${C.green}`,borderRadius:12,padding:"14px 16px",marginBottom:16,textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:600,color:C.green}}>✓ Encuesta enviada</div>
                  <div style={{fontSize:11,color:C.green,opacity:0.8,marginTop:4}}>{submitted.submittedAt}</div>
                  <div style={{fontSize:12,color:C.green,marginTop:6}}>Tu entrenador puede ver tus respuestas.</div>
                </div>
              )}
              {submitted&&<div style={{fontSize:12,color:C.muted,marginBottom:12,textAlign:"center"}}>¿Quieres actualizar? Completa el formulario de nuevo.</div>}
              <div style={cardS}>
                <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{answeredCount}/{SURVEY.length} respondidas</div>
                <div style={{height:4,borderRadius:2,background:C.border,marginBottom:16,overflow:"hidden"}}><div style={{height:"100%",width:`${(answeredCount/SURVEY.length)*100}%`,background:C.accent,borderRadius:2}}/></div>
                {SURVEY.map(item=><SurveyQuestion key={item.id} item={item} value={draft[item.id]} onChange={(k,v)=>setDraft(k,v)} />)}
                <button onClick={submitSurvey} disabled={answeredCount===0} style={{...btnS("primary"),opacity:answeredCount===0?0.4:1,cursor:answeredCount===0?"not-allowed":"pointer"}}>
                  {answeredCount===0?"Responde al menos una pregunta":answeredCount<SURVEY.length?`Enviar (${answeredCount}/${SURVEY.length})`:"Enviar encuesta completa ✓"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // COACH CLIENT DETAIL
  if(selClient){
    const cl=clients.find(c=>c.id===selClient);
    if(!cl){setSelClient(null);return null;}
    const rec=analyzeLoad(submitted);
    return(
      <div style={{background:C.bg,minHeight:"100vh",maxWidth:390,margin:"0 auto",fontFamily:"system-ui,sans-serif",color:C.text}}>
        <div style={{background:C.surface,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`}}>
          <div><div style={{fontSize:15,fontWeight:600}}>{cl.name}</div><div style={{fontSize:11,color:C.muted}}>{cl.goal} · {cl.weight}kg</div></div>
          <div style={avS}>{cl.avatar}</div>
        </div>
        <div style={{display:"flex",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
          {["rutina","kcal","encuesta","perfil"].map(t=>(
            <button key={t} style={{...subTab(clientTab===t),fontSize:10}} onClick={()=>setClientTab(t)}>
              {t==="rutina"?"Rutina":t==="kcal"?"Kcal":t==="encuesta"?`Encuesta${submitted?" ✓":""}`:t==="perfil"?"Perfil":t}
            </button>
          ))}
        </div>
        <div style={{padding:16,paddingBottom:80}}>
          <button style={{background:"transparent",border:"none",color:C.accent,fontSize:13,cursor:"pointer",padding:"0 0 12px"}} onClick={()=>{setSelClient(null);setExercises([]);setKcal([0,0,0,0,0,0,0]);setSubmitted(null);}}>← Volver</button>
          {dataLoading?<Spinner/>:<>
            {clientTab==="rutina"&&(
              <>
                <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:500}}>Ejercicios asignados</div>
                <div style={cardS}>
                  {exercises.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:12}}>Sin ejercicios</div>}
                  {exercises.map((e,i)=>(
                    <div key={e.id} style={{padding:"10px 0",borderBottom:i<exercises.length-1?`1px solid ${C.border}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:14,fontWeight:500}}>{e.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{e.sets} series · {e.reps} reps · {e.rest>0?`${e.rest}s`:"sin descanso"}</div></div>
                      <button onClick={()=>removeExercise(e.id)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,padding:"4px 8px"}}>✕</button>
                    </div>
                  ))}
                </div>
                {showAddEx?(
                  <div style={cardS}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Nuevo ejercicio</div>
                    <input style={{...inp,marginBottom:8}} placeholder="Nombre" value={newEx.name} onChange={e=>setNewEx(p=>({...p,name:e.target.value}))} />
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {[["Series","sets"],["Reps","reps"]].map(([lbl,key])=>(
                        <div key={key}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>{lbl}</div><input style={inp} type="number" value={newEx[key]} onChange={e=>setNewEx(p=>({...p,[key]:e.target.value}))} /></div>
                      ))}
                    </div>
                    <div style={{marginTop:8}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Descanso (seg)</div><input style={inp} type="number" value={newEx.rest} onChange={e=>setNewEx(p=>({...p,rest:e.target.value}))} /></div>
                    <div style={{display:"flex",gap:8,marginTop:12}}>
                      <button style={{...btnS("primary"),flex:1}} onClick={addExercise}>Agregar</button>
                      <button style={{...btnS("outline"),flex:1}} onClick={()=>setShowAddEx(false)}>Cancelar</button>
                    </div>
                  </div>
                ):<button style={btnS("outline")} onClick={()=>setShowAddEx(true)}>+ Agregar ejercicio</button>}
              </>
            )}
            {clientTab==="kcal"&&(
              <>
                <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:500}}>Registro de calorías</div>
                <div style={cardS}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:13,color:C.muted}}>Meta diaria</span><span style={{fontSize:14,fontWeight:600,color:C.accent}}>{cl.kcalGoal} kcal</span></div>
                  <KcalEditor kcal={kcal} goal={cl.kcalGoal} onSave={(i,v)=>saveKcal(i,v,selClient)} />
                </div>
              </>
            )}
            {clientTab==="encuesta"&&(
              <>
                <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:500}}>Encuesta del cliente</div>
                {!submitted?(
                  <div style={{...cardS,textAlign:"center",padding:"32px 16px"}}>
                    <div style={{fontSize:32,marginBottom:8}}>📋</div>
                    <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Encuesta pendiente</div>
                    <div style={{fontSize:12,color:C.muted}}>El cliente aún no ha enviado su encuesta.</div>
                  </div>
                ):(
                  <>
                    {rec&&(
                      <div style={{background:rec.bg,border:`1px solid ${rec.color}`,borderRadius:12,padding:16,marginBottom:16}}>
                        <div style={{fontSize:10,color:rec.color,fontWeight:500,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Recomendación de carga</div>
                        <div style={{fontSize:22,fontWeight:700,color:rec.color,marginBottom:4}}>{rec.label}</div>
                        <div style={{fontSize:12,color:rec.color,opacity:0.9,marginBottom:8}}>{rec.desc}</div>
                        <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${rec.color}44`,paddingTop:8}}>
                          <span style={{fontSize:11,color:rec.color,opacity:0.7}}>Puntaje promedio</span>
                          <span style={{fontSize:16,fontWeight:700,color:rec.color}}>{rec.score}/5</span>
                        </div>
                      </div>
                    )}
                    <div style={{fontSize:11,color:C.muted,marginBottom:10,textAlign:"right"}}>Enviada: {submitted.submittedAt}</div>
                    <div style={cardS}>
                      {SURVEY.map(({id,q,type,labels},idx)=>{
                        const val=submitted[id];
                        const display=val!==undefined?(type==="scale5"?`${val+1} — ${labels[val]}`:val):"Sin respuesta";
                        return(
                          <div key={id} style={{paddingBottom:12,marginBottom:12,borderBottom:idx<SURVEY.length-1?`1px solid ${C.border}`:"none"}}>
                            <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{q}</div>
                            <div style={{fontSize:13,fontWeight:500,color:val!==undefined?C.text:C.muted,fontStyle:val!==undefined?"normal":"italic"}}>{display}</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
            {clientTab==="perfil"&&(
              <>
                <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:500}}>Datos del cliente</div>
                <div style={cardS}>
                  {[["Nombre",cl.name],["Email",cl.email],["Objetivo",cl.goal],["Peso",`${cl.weight} kg`],["Meta calórica",`${cl.kcalGoal} kcal/día`]].map(([lbl,val])=>(
                    <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontSize:13,color:C.muted}}>{lbl}</span><span style={{fontSize:13,fontWeight:500}}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={{...btnS("outline"),flex:1}} onClick={()=>setEditingClientId(selClient)}>Editar datos</button>
                  <button style={{...btnS("red"),flex:1}} onClick={()=>deleteClient(selClient)}>Eliminar cliente</button>
                </div>
              </>
            )}
          </>}
        </div>
        <div style={{display:"flex",background:C.surface,borderTop:`1px solid ${C.border}`,position:"sticky",bottom:0}}>
          <button style={navBtn(false)} onClick={()=>{setSelClient(null);setExercises([]);setKcal([0,0,0,0,0,0,0]);setSubmitted(null);}}><span style={{fontSize:18}}>👥</span><span>Clientes</span></button>
          <button style={{...navBtn(false),color:C.red}} onClick={handleLogout}><span style={{fontSize:18}}>🚪</span><span>Salir</span></button>
        </div>
      </div>
    );
  }

  // COACH LIST
  return(
    <div style={{background:C.bg,minHeight:"100vh",maxWidth:390,margin:"0 auto",fontFamily:"system-ui,sans-serif",color:C.text}}>
      <div style={{background:C.surface,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`}}>
        <div><div style={{fontSize:16,fontWeight:600,color:C.accent}}>GymCoach Pro</div><div style={{fontSize:11,color:C.muted}}>Entrenador</div></div>
        <button onClick={handleLogout} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"6px 12px",fontSize:11,cursor:"pointer"}}>Salir</button>
      </div>
      <div style={{padding:16,paddingBottom:80}}>
        {tab==="clients"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontWeight:500}}>Mis clientes ({clients.length})</div>
              <button onClick={()=>setShowAddClient(true)} style={{background:C.accent,border:"none",color:"#fff",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:500,cursor:"pointer"}}>+ Agregar</button>
            </div>
            {showAddClient&&(
              <div style={{...cardS,borderColor:C.accent}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:12,color:C.accent}}>Nuevo cliente</div>
                {[["Nombre completo *","name","text"],["Email *","email","email"],["Contraseña *","password","password"],["Objetivo","goal","text"],["Peso (kg)","weight","number"],["Meta kcal/día","kcalGoal","number"]].map(([lbl,key,type])=>(
                  <div key={key} style={{marginBottom:8}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{lbl}</div>
                    <input style={inp} type={type} value={newClient[key]} placeholder={lbl} onChange={e=>setNewClient(p=>({...p,[key]:e.target.value}))} />
                  </div>
                ))}
                {addClientError&&<div style={{fontSize:12,color:C.red,marginBottom:8}}>{addClientError}</div>}
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button style={{...btnS("primary"),flex:1,opacity:addClientLoading?0.6:1}} onClick={addClient} disabled={addClientLoading}>{addClientLoading?"Creando...":"Agregar"}</button>
                  <button style={{...btnS("outline"),flex:1}} onClick={()=>{setShowAddClient(false);setAddClientError("");}}>Cancelar</button>
                </div>
              </div>
            )}
            {clients.map(c=>(
              <div key={c.id} style={{...cardS,cursor:"pointer"}} onClick={async()=>{setSelClient(c.id);setClientTab("rutina");setShowAddEx(false);await loadClientDetail(c.id);}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={avS}>{c.avatar}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:500}}>{c.name}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{c.goal} · {c.weight}kg</div>
                    <span style={{background:C.accentMuted,color:C.accent,fontSize:10,borderRadius:6,padding:"2px 8px",marginTop:4,display:"inline-block"}}>{c.kcalGoal} kcal/día</span>
                  </div>
                  <div style={{color:C.muted,fontSize:18}}>›</div>
                </div>
              </div>
            ))}
          </>
        )}
        {tab==="stats"&&(
          <>
            <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,fontWeight:500}}>Resumen general</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[["Clientes activos",clients.length],["Sesiones esta semana",12]].map(([lbl,val])=>(
                <div key={lbl} style={{background:C.surface,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:22,fontWeight:600}}>{val}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{lbl}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{display:"flex",background:C.surface,borderTop:`1px solid ${C.border}`,position:"sticky",bottom:0}}>
        <button style={navBtn(tab==="clients")} onClick={()=>setTab("clients")}><span style={{fontSize:18}}>👥</span><span>Clientes</span></button>
        <button style={navBtn(tab==="stats")} onClick={()=>setTab("stats")}><span style={{fontSize:18}}>📊</span><span>Stats</span></button>
        <button style={{...navBtn(false),color:C.red}} onClick={handleLogout}><span style={{fontSize:18}}>🚪</span><span>Salir</span></button>
      </div>
    </div>
  );
}