
/**
 * Renders a users pages that allows to switch between all users in a space
 * and all users in the org.
 */

import React from 'react';

import Loading from './loading.jsx';
import userActions from '../actions/user_actions.js';
import UserList from './user_list.jsx';
import UserStore from '../stores/user_store.js';
import Tabnav from './tabnav.jsx';

const TAB_SPACE_NAME = 'space_users';
const TAB_ORG_NAME = 'org_users';

function stateSetter(currentState) {
  let users = [];
  const currentTab = UserStore.currentlyViewedType;
  if (currentTab === TAB_SPACE_NAME) {
    users = UserStore.getAllInSpace(currentState.currentSpaceGuid);
  } else {
    users = UserStore.getAllInOrg(currentState.currentOrgGuid);
  }

  return {
    error: UserStore.getError(),
    currentTab,
    loading: UserStore.fetching,
    users
  };
}

export default class Users extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      currentOrgGuid: props.initialOrgGuid,
      currentSpaceGuid: props.initialSpaceGuid,
      currentTab: props.initialCurrentTab,
      loading: UserStore.fetching,
      users: (props.initialCurrentTab === TAB_ORG_NAME) ?
        UserStore.getAllInOrg(props.initialOrgGuid) :
        UserStore.getAllInSpace(props.initialSpaceGuid)
    };

    this._onChange = this._onChange.bind(this);
    this._setTab = this._setTab.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleAddPermissions = this.handleAddPermissions.bind(this);
    this.handleRemovePermissions = this.handleRemovePermissions.bind(this);
  }

  componentDidMount() {
    UserStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this._onChange);
  }

  _onChange() {
    this.setState(stateSetter(this.state));
  }

  _setTab(tab) {
    userActions.changeCurrentlyViewedType(tab);
  }

  handleTabClick(tab, ev) {
    ev.preventDefault();
    this._setTab(tab);
  }

  handleRemove(userGuid, ev) {
    ev.preventDefault();
    userActions.deleteUser(userGuid, this.state.currentOrgGuid);
  }

  handleAddPermissions(roleKey, userGuid) {
    userActions.addUserRoles(roleKey,
                                userGuid,
                                this.resourceGuid,
                                this.resourceType);
  }

  handleRemovePermissions(roleKey, userGuid) {
    userActions.deleteUserRoles(roleKey,
                                userGuid,
                                this.resourceGuid,
                                this.resourceType);
  }

  get resourceType() {
    var resourceType = this.state.currentTab === TAB_ORG_NAME ? 'org' : 'space';
    return resourceType;
  }

  get resourceGuid() {
    const resourceGuid = this.state.currentTab === TAB_ORG_NAME ?
      this.state.currentOrgGuid : this.state.currentSpaceGuid;
    return resourceGuid;
  }

  get subNav() {
    const tabs = [
      { name: 'space_users' },
      { name: 'org_users' }
    ];
    // TODO refactor link, use a special link component.
    tabs[0].element = (
      <a onClick={ this.handleTabClick.bind(this, tabs[0].name) }>
        Current space users
      </a>
    );

    tabs[1].element = (
      <a onClick={ this.handleTabClick.bind(this, tabs[1].name) }>
        All organization users
      </a>
    );

    return tabs;
  }

  render() {
    let removeHandler;
    let errorMessage;
    let content = (<UserList
      initialUsers={ this.state.users }
      initialUserType= { this.state.currentTab }
      onRemove={ removeHandler }
      onAddPermissions={ this.handleAddPermissions }
      onRemovePermissions={ this.handleRemovePermissions }
    />);

    if (this.state.currentTab === TAB_ORG_NAME) {
      removeHandler = this.handleRemove;
    }

    if (this.state.loading) {
      content = <Loading text="Loading users" />;
    }

    if (this.state.error) {
      // TODO make this an error message component
      errorMessage = (
        <div className="alert alert-danger" role="alert">
          { this.state.error.description }</div>
      );
    }

    return (
      <div>
      <Tabnav items={ this.subNav }
        classes={ ['test-subnav-users'] }
        initialItem={ this.state.currentTab }
      />
        { errorMessage }
        <div>
          <p>For more information on different roles and what they mean see <a
            href="http://docs.cloudfoundry.org/concepts/roles.html#roles"
            target="_blank">
            <span>&nbsp;</span>Cloud Foundry's roles information</a>.
          </p>
          <p>To add a user to an organization see <a
            href="https://docs.cloud.gov/apps/managing-teammates/"
            target="_blank">
            <span>&nbsp;</span>managing teammates</a> for more information.
          </p>
          <div role="tabpanel">
            { content }
          </div>
        </div>
      </div>
    );
  }

}

Users.propTypes = {
  initialCurrentTab: React.PropTypes.string.isRequired,
  initialOrgGuid: React.PropTypes.string.isRequired,
  initialSpaceGuid: React.PropTypes.string.isRequired
};

Users.defaultProps = {
  initialCurrentTab: 'space_users'
};