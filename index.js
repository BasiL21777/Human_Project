require('dotenv').config()
const express = require('express');
const path = require('path');
const morgan = require('morgan');
// const coursesRouter = require('./routes/courses.routes.js');
const usersRouter = require('./routes/users.routes.js');
const authRoutes = require('./routes/auth.routes.js');
const appointmentRoutes = require('./routes/appointment.routes.js');
const patientRecordRoutes=require('./routes/patientRecord.routes.js')
const {ERROR}=require('./utils/httpStatusText')
const app = express();
app.use(morgan("dev"));
const cors = require('cors');
const mongoose=require('mongoose');


const url = process.env.MONGO_URL ;
mongoose.connect(url).then(()=>{
  console.log("Mongo BD Started ... ");
});

app.use(cors());
app.use(express.json());

// Protected routes
// app.use('/api/courses/', coursesRouter);
app.use('/api/users/', usersRouter);
app.use('/api/appointment/', appointmentRoutes);
app.use('/auth/', authRoutes);
app.use('/patient_Record/', patientRecordRoutes);
app.use('/uploads',express.static(path.join(__dirname,'uploads')))

app.all(/.*/,(req,res,next)=>{
  res.status(404).json({status:ERROR,msg:"this resource is not available"});
});

// Error handler
app.use((err,req,res,next)=>{
  res.status(err.statusCode||500).json({status:err.statusText||ERROR,msg:err.message,data:null})
});

const port=process.env.PORT;
app.listen(port||5000, () => {
  console.log("Listening on 5000...");
});
