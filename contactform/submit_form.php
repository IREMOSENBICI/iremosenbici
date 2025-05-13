<<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Formulario de contacto</title>
</head>

<body>
<?php
if(isset($_POST['contactFrmSubmit']) && !empty($_POST['nombre']) && !empty($_POST['email']) && (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL) === false) && !empty($_POST['asunto'])&& !empty($_POST['mensaje'])){
    
    // Submitted form data
    $nombre   = $_POST['nombre'];
    $email  = $_POST['email'];
    $mensaje= $_POST['mensaje'];
    
    /*
     * Send email to admin
     */
    $to     = 'iremosenbici@gmail.com';
    $subject= $_POST['asunto'];
    
    $htmlContent = '
    <h4>Mensaje enviado por</h4>
    <table cellspacing="0" style="width: 300px; height: 200px;">
        <tr>
            <th>Nombre:</th><td>'.$nombre.'</td>
        </tr>
        <tr style="background-color: #e0e0e0;">
            <th>Email:</th><td>'.$email.'</td>
        </tr>
        <tr>
            <th>Mensaje:</th><td>'.$mensaje.'</td>
        </tr>
    </table>';
    
    // Set content-type header for sending HTML email
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
    
    // Additional headers
    $headers .= 'From: Iremosenbici<iremosenbici@gmail.com>' . "\r\n";
    
    // Send email
    if(mail($to,$subject,$htmlContent,$headers)){
        $status = 'ok';
    }else{
        $status = 'err';
    }
    
    // Output status
    echo $status;die;
}
?>

</body>
</html>


