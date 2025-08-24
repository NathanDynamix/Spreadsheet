import React from 'react';
import {BrowserRouter, Routes, Route } from "react-router-dom"; 
import { Toaster } from 'sonner';
import SpreadsheetModel from './component/SpreadsheetModel';
import FormulaModel from './component/FormulaModel';
import FormulaWorking from './component/FormulaWorking';
import Integration from './component/Integration';
import SpreadsheetPage from './component/SpreadsheetPage';
import PowerBIDashboard from './component/PowerBIDashboard';
import StrixChart from './component/StrixChart';
import Menu from './component/Menubar';
import ImageLink from './component/Image&Link';
import AdvancedBIDashboard from './component/AdvancedBIDashboard';
import StrixAuth from './component/StrixAuth';
import ForgotPassword from "./component/ForgetPassword";

const App = () => {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ flex: "1" }}>
          <Routes>
            <Route path="/" element={<StrixAuth/>}/>
            <Route path="/integration" element={<Integration/>}/>
             <Route path="/dashboard" element={<AdvancedBIDashboard/>}/>
            <Route path="/sheet" element={<SpreadsheetPage />} />
            <Route path="/charts" element={<StrixChart />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/forgot-password" element={<ForgotPassword/>} />
            <Route path="/spreadsheet-model" element={<SpreadsheetModel/>}/>
            <Route path="/formula-model" element={<FormulaModel/>}/>
            <Route path="/formula-working" element={<FormulaWorking/>}/>
            <Route path="/powerbi" element={<PowerBIDashboard/>}/>
            <Route path="/image-link" element={<ImageLink/>}/>
           
          </Routes>
        </div>
        <Toaster richColors position="top-center" />
      </div>
    </div>
  )
}

export default App;