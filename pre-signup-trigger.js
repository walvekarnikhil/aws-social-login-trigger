const Aws = require('aws-sdk');
const cognitoIdentityService = new Aws.CognitoIdentityServiceProvider({ apiVersion: '2016-04-19', region: 'us-east-1' });

exports.handler = (event, context, callback) => {

  console.log('Source event', event);

  if (event.triggerSource !== 'PreSignUp_ExternalProvider')
    return callback(null, event);

  // TODO: if supported provider, for now we will skip this

  var emailToSearch = event.request.userAttributes.email;
  var searchUser = {
    UserPoolId: event.userPoolId,
    AttributesToGet: [],
    Filter: 'email=\"' + emailToSearch + '\"',
    Limit: 1
  };
  console.log('Search user', searchUser);
  cognitoIdentityService.listUsers(searchUser, function (err, data) {
    console.log('list user', err, data);
    if (err || !data || data.length === 0) {
      return callback(null, event);
    }
    var usr = data.Users[0];
    var destinationUserName = usr.Username;
    console.log('Found user ', destinationUserName);
    var sourceUsernameParts = event.userName.split('_');
    var sourceProvider = sourceUsernameParts[0];
    var sourceUsername = sourceUsernameParts[1];
    var mergeParams = {
      DestinationUser: {
        ProviderAttributeName: 'Username',
        ProviderAttributeValue: destinationUserName,
        ProviderName: 'Cognito'
      },
      SourceUser: {
        ProviderAttributeName: 'Cognito_Subject',
        ProviderAttributeValue: sourceUsername,
        ProviderName: sourceProvider
      },
      UserPoolId: event.userPoolId
    };
    cognitoIdentityService.adminLinkProviderForUser(mergeParams, function (err, data) {
      // TODO: Check error and return appropriately.
      if (err) console.log('err', JSON.stringify(err), err.stack); // an error occurred
      else console.log('else', JSON.stringify(data)); // successful response
      return callback(null, event);
    });
  });
};

