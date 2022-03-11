const mysql = require('mysql');

module.exports = {

    /**
     * 
     * @param {mysql.Connection} con 
     * @param {string} permissionLevel 
     * @param {string} user 
     * 
     * @returns {boolean}
     */
    async checkPermissions(con, permissionLevel, user) {

        let query = `SELECT * FROM permissions WHERE discordid = ${user}`

        con.query(query).then(rows => {

            switch (permissionLevel) {
                case 'all':
                    return true; // Anyone can use it so go ahead
                case 'owner':
                    return (rows[0].isOwner==1);
                case 'moderator':
                    return (rows[0].isMod==1);
                case 'administrator':
                    return (rows[0].isAdmin==1);
                default:
                    return false; // If this does happen I don't want anything else to happen o-o
            }

        });

    }

}