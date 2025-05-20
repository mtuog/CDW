import React, { useState } from 'react';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePassword = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('Vui lòng nhập mật khẩu mới và xác nhận giống nhau');
      return;
    }

    const passwordDetails = {
      oldPassword: oldPassword,
      newPassword: newPassword,
    };

    fetch('/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordDetails),
    })
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
        if (data.message === 'Đổi Mật Khẩu Thành Công') {
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        setMessage('An error occurred. Please try again.');
      });
  };

  return (
    <div>
   <div class="container py-5 d-flex justify-content-center align-items-center min-vh-100">
  <div class="row justify-content-center">
    <div  class="col"> 
         <div style={{ width: '600px' }} class="card card-outline-secondary">
                        <div class="card-header">
                            <h3 class="mb-0">Đổi mật khẩu</h3>
                        </div>
                        <div class="card-body">
                        <form onSubmit={handleChangePassword}>
                        <div class="form-group">
                                    <label for="inputPasswordOld">Mật Khẩu Hiện Tại</label>
                                    <input  type="password" class="form-control form-control-lg"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required/>
                                </div>
                                <div class="form-group">
                                    <label for="inputPasswordNew">Mật Khẩu Mới</label>
                                    <input type="password" class="form-control form-control-lg"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required/>
                                    <span class="form-text small text-muted">
                                            Nhập mật khẩu mới
                                        </span>
                                </div>
                                <div class="form-group">
                                    <label for="inputPasswordNewVerify">Đổi mật khẩu</label>
                                    <input type="password" class="form-control form-control-lg"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required/>
                                    <span class="form-text small text-muted">
                                            Nhập lại mật khẩu mới
                                        </span>
                                </div>
                                <div class="form-group">
                                    <button type="submit" class="btn btn-success btn-lg float-right">Đổi Mật Khẩu</button>
                                {message && <p className="text-danger">{message}</p>}   

                                </div>
                            </form>
                        </div>
                    </div>
                    </div>
                    </div>
                    </div>
      
    </div>
  );
};

export default ChangePassword;
