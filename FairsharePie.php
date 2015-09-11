<?php

    requireLogin();

    $username = $_SESSION['userdata']['username'];
    $pdo = \Fsl\Database::connect();
    $query = <<<EOT
        select user, shares from slurm.fsl_assoc_table where acct=? and user != "" and not deleted; 
EOT;
    $statement = $pdo->prepare($query);
    $statement->execute(array($username));
    $result = $statement->fetchAll();

    header('Content-Type: application/json');
    echo json_encode( array("rows" => $result) );

