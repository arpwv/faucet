/* eslint-disable react/prop-types */
import React from 'react';
import { message, Form, Icon, Input, Button } from 'antd';
import fetch from 'isomorphic-fetch';
import { checkStatus, parseJSON } from '../../../utils/fetch';

class ConfirmPhoneNumber extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false,
    };
  }

  handleSubmit = (e) => {
    e.preventDefault();
    if (this.state.submitting) return;
    this.setState({ submitting: true });
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        fetch(`/api/confirm_sms?token=${this.props.token}&code=${values.code}`)
          .then(checkStatus)
          .then(parseJSON)
          .then((data) => {
            this.setState({ submitting: false });
            if (data.success) {
              if (this.props.onSubmit) {
                this.props.onSubmit(values, data.token);
              }
            }
          })
          .catch((error) => {
            this.setState({ submitting: false });
            error.response.json().then((data) => {
              const emailError = data.errors.find(o => o.field === 'code');
              if (emailError) {
                this.props.form.setFields({
                  code: {
                    value: values.code,
                    errors: [new Error(emailError.error)],
                  },
                });
              }
            });
          });
      } else {
        this.setState({ submitting: false });
      }
    });
  };

  resendCode = () => {
    const { token, phoneNumber, prefix } = this.props;
    fetch(`/api/request_sms?token=${token}&phoneNumber=${phoneNumber}&prefix=${prefix}`)
      .then(checkStatus)
      .then(parseJSON)
      .then((data) => {
        this.setState({ submitting: false });
        if (data.success) {
          message.success('New code sent.');
        }
      })
      .catch((error) => {
        error.response.json().then((data) => {
          message.error(data.errors[0].error);
        });
      });
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Form onSubmit={this.handleSubmit} className="signup-form confirm-phone">
        <Form.Item
          hasFeedback
        >
          {getFieldDecorator('code', {
            rules: [{
              required: true, message: 'Please input the code you have received.!',
            }],
          })(
            <Input
              prefix={<Icon type="key" />}
              suffix={<a href={undefined} onClick={this.resendCode}>Resend</a>}
              placeholder="Confirmation code"
            />,
          )}
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={this.state.submitting}>Continue</Button>
        </Form.Item>
      </Form>
    );
  }
}

export default Form.create()(ConfirmPhoneNumber);
